// Local NTFS primitives. No pathname reconstruction after root acquisition.
#define NOMINMAX
#include <windows.h>
#include <winternl.h>
#if defined(EXSPECSO_CONTAINMENT_TEST)
#include <bcrypt.h>
#include <sddl.h>
#endif
#include <array>
#include <cerrno>
#include <cstddef>
#include <cstring>
#include <cwchar>
#include <memory>
#include <optional>
#include <stdexcept>
#include <system_error>
#include <vector>

namespace contained {
void require(bool condition, const char* message) { if (!condition) throw std::invalid_argument(message); }
[[noreturn]] void fail(const char* operation, DWORD code = GetLastError()) {
  if (code == ERROR_FILE_NOT_FOUND || code == ERROR_PATH_NOT_FOUND)
    throw std::system_error(ENOENT, std::generic_category(), operation);
  throw std::system_error(static_cast<int>(code), std::system_category(), operation);
}
template<class T> T systemFunction(const char* name) {
  // ntdll is already loaded by Windows; never search a caller-controlled DLL path.
  auto address = GetProcAddress(GetModuleHandleW(L"ntdll.dll"), name);
  require(address != nullptr, "required native Windows API unavailable");
  return reinterpret_cast<T>(address);
}
using NtCreate = NTSTATUS (NTAPI*)(PHANDLE, ACCESS_MASK, POBJECT_ATTRIBUTES, PIO_STATUS_BLOCK,
  PLARGE_INTEGER, ULONG, ULONG, ULONG, ULONG, PVOID, ULONG);
using NtSet = NTSTATUS (NTAPI*)(HANDLE, PIO_STATUS_BLOCK, PVOID, ULONG, FILE_INFORMATION_CLASS);
using StatusToError = ULONG (NTAPI*)(NTSTATUS);
void ntCheck(NTSTATUS status, const char* operation) {
  if (status < 0) fail(operation, systemFunction<StatusToError>("RtlNtStatusToDosError")(status));
}
std::wstring wide(const std::string& value) {
  int length = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), nullptr, 0);
  require(length > 0 && length < 32768, "invalid UTF-8 name");
  std::wstring result(length, L'\0');
  if (!MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), result.data(), length)) fail("decode name");
  return result;
}
std::string utf8(const wchar_t* value, int length) {
  int size = WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, value, length, nullptr, 0, nullptr, nullptr);
  require(size > 0, "invalid UTF-16 directory entry");
  std::string result(size, '\0');
  if (!WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, value, length, result.data(), size, nullptr, nullptr)) fail("encode name");
  return result;
}
struct Authority { bool active = true; };
struct Handle {
  HANDLE value = INVALID_HANDLE_VALUE;
  bool directory = false, writable = false, root = false, consumed = false;
  FILE_ID_INFO parentIdentity{};
  std::string name;
  std::shared_ptr<Authority> authority;
  ~Handle() { if (value != INVALID_HANDLE_VALUE) CloseHandle(value); }
};
using Owned = std::unique_ptr<Handle>;
void active(Handle& h) { require(h.value != INVALID_HANDLE_VALUE && h.authority && h.authority->active, "closed capability"); }
void directory(Handle& h) { active(h); require(h.directory, "directory capability required"); }
template<class T> T query(HANDLE handle, FILE_INFO_BY_HANDLE_CLASS kind) {
  T result{};
  if (!GetFileInformationByHandleEx(handle, kind, &result, sizeof(result))) fail("GetFileInformationByHandleEx");
  return result;
}
FILE_ID_INFO identity(Handle& h) { active(h); return query<FILE_ID_INFO>(h.value, FileIdInfo); }
bool sameIdentity(const FILE_ID_INFO& a, const FILE_ID_INFO& b) {
  return a.VolumeSerialNumber == b.VolumeSerialNumber && std::memcmp(a.FileId.Identifier, b.FileId.Identifier, 16) == 0;
}
struct Metadata { uint64_t st_dev, st_ino, inodeHigh, st_size; };
Metadata metadata(Handle& h) {
  auto id = identity(h); auto info = query<FILE_STANDARD_INFO>(h.value, FileStandardInfo);
  Metadata result{}; result.st_dev = id.VolumeSerialNumber; result.st_size = info.EndOfFile.QuadPart;
  std::memcpy(&result.st_ino, id.FileId.Identifier, 8);
  std::memcpy(&result.inodeHigh, id.FileId.Identifier + 8, 8);
  return result;
}
Owned acquire(HANDLE parent, const std::wstring& name, bool isDirectory, ULONG disposition,
              ACCESS_MASK extra, std::shared_ptr<Authority> authority) {
  // Allocate ownership before obtaining the OS handle, including on bad_alloc paths.
  auto h = std::make_unique<Handle>();
  h->authority = std::move(authority); h->directory = isDirectory;
  UNICODE_STRING unicode{}; unicode.Buffer = const_cast<PWSTR>(name.data());
  unicode.Length = static_cast<USHORT>(name.size() * sizeof(wchar_t)); unicode.MaximumLength = unicode.Length;
  OBJECT_ATTRIBUTES attributes{}; attributes.Length = sizeof(attributes);
  attributes.RootDirectory = parent; attributes.ObjectName = &unicode; attributes.Attributes = OBJ_CASE_INSENSITIVE;
  IO_STATUS_BLOCK io{};
  const ACCESS_MASK access = FILE_READ_ATTRIBUTES | SYNCHRONIZE | extra |
    (isDirectory ? FILE_LIST_DIRECTORY | FILE_TRAVERSE : FILE_READ_DATA);
  const ULONG options = FILE_OPEN_REPARSE_POINT | FILE_SYNCHRONOUS_IO_NONALERT |
    (isDirectory ? FILE_DIRECTORY_FILE : FILE_NON_DIRECTORY_FILE);
  ntCheck(systemFunction<NtCreate>("NtCreateFile")(&h->value, access, &attributes, &io, nullptr,
    FILE_ATTRIBUTE_NORMAL, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
    disposition, options, nullptr, 0), "NtCreateFile");
  require(GetFileType(h->value) == FILE_TYPE_DISK, "disk object required");
  auto tag = query<FILE_ATTRIBUTE_TAG_INFO>(h->value, FileAttributeTagInfo);
  require(!(tag.FileAttributes & (FILE_ATTRIBUTE_REPARSE_POINT | FILE_ATTRIBUTE_DEVICE)), "reparse/device object rejected");
  auto info = query<FILE_STANDARD_INFO>(h->value, FileStandardInfo);
  require((info.Directory != FALSE) == isDirectory && !info.DeletePending, "wrong kind or deleting object");
  return h;
}
Owned openDirectory(Handle& parent, const std::string& name, bool create) {
  directory(parent);
  auto h = acquire(parent.value, wide(name), true, create ? FILE_OPEN_IF : FILE_OPEN, DELETE, parent.authority);
  const auto parentId = identity(parent);
  require(parentId.VolumeSerialNumber == identity(*h).VolumeSerialNumber, "cross-volume descent rejected");
  h->parentIdentity = parentId; h->name = name;
  return h;
}
Owned createDirectory(Handle& parent, const std::string& name) {
  directory(parent);
  auto h = acquire(parent.value, wide(name), true, FILE_CREATE, DELETE, parent.authority);
  const auto parentId = identity(parent);
  require(parentId.VolumeSerialNumber == identity(*h).VolumeSerialNumber, "cross-volume descent rejected");
  h->parentIdentity = parentId; h->name = name;
  return h;
}
Owned openRoot(const std::string& path) {
  require(path.size() >= 3 && std::isalpha(static_cast<unsigned char>(path[0])) && path[1] == ':' && path[2] == '\\', "local absolute drive root required");
  const auto drive = wide(path.substr(0, 3));
  require(GetDriveTypeW(drive.c_str()) == DRIVE_FIXED, "ordinary local fixed drive required");
  auto h = acquire(nullptr, L"\\??\\" + drive, true, FILE_OPEN, 0, std::make_shared<Authority>());
  size_t start = 3;
  while (start < path.size()) {
    const auto end = path.find('\\', start); auto name = path.substr(start, end - start);
    require(!name.empty() && name != "." && name != ".." && name.find_first_of("/:\0", 0, 3) == std::string::npos, "invalid root component");
    h = openDirectory(*h, name, false);
    if (end == std::string::npos) break;
    start = end + 1;
  }
  wchar_t filesystem[32]{};
  if (!GetVolumeInformationByHandleW(h->value, nullptr, 0, nullptr, nullptr, nullptr, filesystem, 32)) fail("GetVolumeInformationByHandleW");
  require(std::wcscmp(filesystem, L"NTFS") == 0, "local NTFS required");
  h->root = true; return h;
}
Owned openFile(Handle& parent, const std::string& name, bool create) {
  directory(parent);
  auto h = acquire(parent.value, wide(name), false, create ? FILE_CREATE : FILE_OPEN,
    create ? FILE_WRITE_DATA | DELETE : 0, parent.authority);
  const auto parentId = identity(parent);
  require(parentId.VolumeSerialNumber == identity(*h).VolumeSerialNumber, "cross-volume descent rejected");
  h->writable = create; h->parentIdentity = parentId; h->name = name; return h;
}
void seek(Handle& h) { LARGE_INTEGER zero{}; if (!SetFilePointerEx(h.value, zero, nullptr, FILE_BEGIN)) fail("SetFilePointerEx"); }
std::vector<char> read(Handle& h) {
  active(h); require(!h.directory, "file capability required");
  auto before = metadata(h); require(before.st_size <= 16 * 1024 * 1024, "file exceeds bounded read");
  std::vector<char> bytes(static_cast<size_t>(before.st_size)); seek(h);
  size_t offset = 0;
  while (offset < bytes.size()) {
    DWORD count = 0;
    if (!ReadFile(h.value, bytes.data() + offset, static_cast<DWORD>(bytes.size() - offset), &count, nullptr)) fail("ReadFile");
    require(count > 0, "file shortened during read"); offset += count;
  }
  require(metadata(h).st_size == before.st_size, "file changed during read"); return bytes;
}
void write(Handle& h, const void* bytes, size_t size) {
  active(h); require(!h.directory && h.writable && !h.consumed, "private writable file required");
  require(size <= 16 * 1024 * 1024, "write exceeds bound"); seek(h);
  size_t offset = 0;
  while (offset < size) {
    DWORD count = 0;
    if (!WriteFile(h.value, static_cast<const char*>(bytes) + offset, static_cast<DWORD>(size - offset), &count, nullptr)) fail("WriteFile");
    require(count > 0, "zero-byte write"); offset += count;
  }
  if (!SetEndOfFile(h.value)) fail("SetEndOfFile private sibling");
}
bool sync(Handle& h) {
  active(h);
  // Windows does not expose a supported directory flush through this read-only handle.
  // The contract covers process interruption, not power-loss durability.
  if (h.directory) return false;
  if (!FlushFileBuffers(h.value)) fail("FlushFileBuffers"); return true;
}
void close(Handle& h) {
  if (h.root && h.authority) h.authority->active = false;
  auto value = h.value; h.value = INVALID_HANDLE_VALUE;
  if (value != INVALID_HANDLE_VALUE && !CloseHandle(value)) fail("CloseHandle");
}
std::vector<std::string> list(Handle& h) {
  directory(h); std::vector<std::string> names;
  alignas(FILE_ID_BOTH_DIR_INFO) std::array<unsigned char, 65536> bytes{};
  auto kind = FileIdBothDirectoryRestartInfo;
  for (;;) {
    if (!GetFileInformationByHandleEx(h.value, kind, bytes.data(), static_cast<DWORD>(bytes.size()))) {
      auto error = GetLastError(); if (error == ERROR_NO_MORE_FILES) break; fail("list directory", error);
    }
    kind = FileIdBothDirectoryInfo;
    size_t offset = 0;
    for (;;) {
      const size_t prefix = offsetof(FILE_ID_BOTH_DIR_INFO, FileName);
      require(offset <= bytes.size() - prefix, "invalid directory record");
      auto info = reinterpret_cast<const FILE_ID_BOTH_DIR_INFO*>(bytes.data() + offset);
      require(info->FileNameLength % 2 == 0 && info->FileNameLength <= bytes.size() - offset - prefix, "invalid directory name record");
      auto name = utf8(info->FileName, static_cast<int>(info->FileNameLength / 2));
      if (name != "." && name != "..") names.push_back(std::move(name));
      if (!info->NextEntryOffset) break;
      require(info->NextEntryOffset >= prefix + info->FileNameLength && info->NextEntryOffset % alignof(FILE_ID_BOTH_DIR_INFO) == 0 && info->NextEntryOffset < bytes.size() - offset, "invalid directory record offset");
      offset += info->NextEntryOffset;
    }
  }
  return names;
}
#if defined(EXSPECSO_CONTAINMENT_TEST)
struct WinHandle {
  HANDLE value = INVALID_HANDLE_VALUE;
  explicit WinHandle(HANDLE handle = INVALID_HANDLE_VALUE) : value(handle) {}
  ~WinHandle() { if (value != INVALID_HANDLE_VALUE && value != nullptr) CloseHandle(value); }
  WinHandle(const WinHandle&) = delete;
  WinHandle& operator=(const WinHandle&) = delete;
};
struct LocalAllocation {
  void* value = nullptr;
  ~LocalAllocation() { if (value) LocalFree(value); }
};
std::optional<std::string> testEnvironment(const char* name) {
  SetLastError(ERROR_SUCCESS);
  const DWORD size = GetEnvironmentVariableA(name, nullptr, 0);
  if (!size && GetLastError() == ERROR_ENVVAR_NOT_FOUND) return std::nullopt;
  require(size > 1 && size <= 256, "invalid containment test activation");
  std::vector<char> bytes(size);
  require(GetEnvironmentVariableA(name, bytes.data(), size) == size - 1, "cannot read containment test activation");
  return std::string(bytes.data(), size - 1);
}
std::string jsonString(const std::string& value) {
  std::string escaped;
  for (const unsigned char c : value) {
    require(c >= 32, "unsupported control character in test provider path");
    if (c == '\\' || c == '\"') escaped += '\\';
    escaped += static_cast<char>(c);
  }
  return escaped;
}
std::wstring sidText(PSID sid) {
  LPWSTR text = nullptr;
  require(ConvertSidToStringSidW(sid, &text) != 0, "cannot format containment test SID");
  LocalAllocation holder{ text };
  return text;
}
std::wstring pipeSecurityDescriptor() {
  WinHandle token;
  require(OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token.value) != 0, "cannot inspect containment test token");
  DWORD size = 0;
  GetTokenInformation(token.value, TokenUser, nullptr, 0, &size);
  require(GetLastError() == ERROR_INSUFFICIENT_BUFFER && size > 0, "cannot size containment test user SID");
  std::vector<unsigned char> user(size);
  require(GetTokenInformation(token.value, TokenUser, user.data(), size, &size) != 0, "cannot read containment test user SID");
  const auto userSid = sidText(reinterpret_cast<TOKEN_USER*>(user.data())->User.Sid);
  size = 0;
  GetTokenInformation(token.value, TokenGroups, nullptr, 0, &size);
  require(GetLastError() == ERROR_INSUFFICIENT_BUFFER && size > 0, "cannot size containment test logon SID");
  std::vector<unsigned char> groups(size);
  require(GetTokenInformation(token.value, TokenGroups, groups.data(), size, &size) != 0, "cannot read containment test logon SID");
  const auto* entries = reinterpret_cast<TOKEN_GROUPS*>(groups.data());
  PSID logon = nullptr;
  for (DWORD index = 0; index < entries->GroupCount; ++index) if (entries->Groups[index].Attributes & SE_GROUP_LOGON_ID) { logon = entries->Groups[index].Sid; break; }
  require(logon != nullptr, "containment test logon SID missing");
  const auto logonSid = sidText(logon);
  return L"D:P(A;;GA;;;SY)(A;;GA;;;" + userSid + L")(A;;GA;;;" + logonSid + L")";
}
struct Deadline {
  ULONGLONG expires = GetTickCount64() + 10'000;
  DWORD remaining() const { const auto now = GetTickCount64(); return now >= expires ? 0 : static_cast<DWORD>(std::min<ULONGLONG>(expires - now, MAXDWORD)); }
};
DWORD finishOverlapped(HANDLE pipe, OVERLAPPED& operation, const Deadline& deadline, const char* label) {
  const DWORD wait = WaitForSingleObject(operation.hEvent, deadline.remaining());
  if (wait != WAIT_OBJECT_0) {
    CancelIoEx(pipe, &operation);
    DWORD drained = 0;
    GetOverlappedResult(pipe, &operation, &drained, TRUE); // completion is drained before OVERLAPPED storage dies
    require(false, "containment test pipe deadline exceeded");
  }
  DWORD count = 0;
  if (!GetOverlappedResult(pipe, &operation, &count, FALSE)) fail(label);
  return count;
}
void pipeWrite(HANDLE pipe, const std::string& frame, const Deadline& deadline) {
  require(!frame.empty() && frame.size() <= 1024, "invalid containment test event frame");
  WinHandle event(CreateEventW(nullptr, TRUE, FALSE, nullptr)); require(event.value != nullptr, "cannot create containment test write event");
  OVERLAPPED operation{}; operation.hEvent = event.value;
  DWORD written = 0;
  if (!WriteFile(pipe, frame.data(), static_cast<DWORD>(frame.size()), &written, &operation)) {
    const auto error = GetLastError();
    if (error != ERROR_IO_PENDING) fail("containment test event write", error);
    written = finishOverlapped(pipe, operation, deadline, "containment test event write");
  }
  require(written == frame.size(), "truncated containment test event frame");
}
std::string pipeRead(HANDLE pipe, const Deadline& deadline) {
  std::array<char, 1024> bytes{};
  WinHandle event(CreateEventW(nullptr, TRUE, FALSE, nullptr)); require(event.value != nullptr, "cannot create containment test acknowledgement event");
  OVERLAPPED operation{}; operation.hEvent = event.value;
  DWORD count = 0;
  if (!ReadFile(pipe, bytes.data(), static_cast<DWORD>(bytes.size()), &count, &operation)) {
    const auto error = GetLastError();
    require(error != ERROR_MORE_DATA, "oversized containment test acknowledgement");
    if (error != ERROR_IO_PENDING) fail("containment test acknowledgement read", error);
    count = finishOverlapped(pipe, operation, deadline, "containment test acknowledgement read");
  }
  require(count > 0 && count < bytes.size(), "truncated containment test acknowledgement");
  return std::string(bytes.data(), count);
}
void barrier() {
  static bool reached = false;
  const auto operation = testEnvironment("EXSPECSO_CONTAINMENT_TEST_OPERATION");
  const auto channel = testEnvironment("EXSPECSO_CONTAINMENT_TEST_CHANNEL_ID");
  const auto controller = testEnvironment("EXSPECSO_CONTAINMENT_TEST_CONTROLLER_PID");
  if (!operation && !channel && !controller) return;
  require(operation && channel && controller && !reached, "incomplete containment test activation");
  require(*operation == "replace:before" && channel->size() == 64 && std::all_of(channel->begin(), channel->end(), [](unsigned char c) { return std::isdigit(c) || (c >= 'a' && c <= 'f'); }), "invalid containment test activation");
  require(!controller->empty() && controller->size() <= 10 && controller->front() != '0' && std::all_of(controller->begin(), controller->end(), [](unsigned char c) { return std::isdigit(c); }), "invalid containment test controller PID");
  unsigned long long parsed = 0; try { parsed = std::stoull(*controller); } catch (...) { require(false, "invalid containment test controller PID"); }
  require(parsed > 0 && parsed <= MAXDWORD, "invalid containment test controller PID");
  reached = true;
  HMODULE image{};
  require(GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT, reinterpret_cast<LPCWSTR>(&barrier), &image) != 0, "cannot identify loaded test provider");
  std::array<wchar_t, 32768> providerPath{};
  const DWORD length = GetModuleFileNameW(image, providerPath.data(), static_cast<DWORD>(providerPath.size()));
  require(length > 0 && length < providerPath.size(), "cannot read loaded test provider path");
  std::array<unsigned char, 32> entropy{};
  require(BCryptGenRandom(nullptr, entropy.data(), static_cast<ULONG>(entropy.size()), BCRYPT_USE_SYSTEM_PREFERRED_RNG) == 0, "cannot generate containment test nonce");
  static constexpr char hex[] = "0123456789abcdef";
  std::string nonce; nonce.reserve(entropy.size() * 2); for (const auto byte : entropy) { nonce += hex[byte >> 4]; nonce += hex[byte & 15]; }
  const auto security = pipeSecurityDescriptor();
  PSECURITY_DESCRIPTOR rawSecurity = nullptr;
  require(ConvertStringSecurityDescriptorToSecurityDescriptorW(security.c_str(), SDDL_REVISION_1, &rawSecurity, nullptr) != 0, "cannot create containment test pipe DACL");
  LocalAllocation securityOwner{ rawSecurity };
  SECURITY_ATTRIBUTES attributes{}; attributes.nLength = sizeof(attributes); attributes.lpSecurityDescriptor = rawSecurity;
  const auto endpoint = L"\\\\.\\pipe\\exspecso-containment-" + wide(*channel);
  WinHandle pipe(CreateNamedPipeW(endpoint.c_str(), PIPE_ACCESS_DUPLEX | FILE_FLAG_FIRST_PIPE_INSTANCE | FILE_FLAG_OVERLAPPED,
    PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT | PIPE_REJECT_REMOTE_CLIENTS, 1, 1024, 1024, 0, &attributes));
  require(pipe.value != INVALID_HANDLE_VALUE, "cannot create containment test pipe");
  Deadline deadline;
  WinHandle connectEvent(CreateEventW(nullptr, TRUE, FALSE, nullptr)); require(connectEvent.value != nullptr, "cannot create containment test connect event");
  OVERLAPPED connect{}; connect.hEvent = connectEvent.value;
  if (!ConnectNamedPipe(pipe.value, &connect)) {
    const auto error = GetLastError();
    if (error == ERROR_IO_PENDING) finishOverlapped(pipe.value, connect, deadline, "containment test pipe connect");
    else require(error == ERROR_PIPE_CONNECTED, "containment test pipe connect failed");
  }
  ULONG client = 0; require(GetNamedPipeClientProcessId(pipe.value, &client) != 0 && client == static_cast<DWORD>(parsed), "unexpected containment test pipe client");
  const std::string event = "{\"op\":\"replace:before\",\"childpid\":" + std::to_string(GetCurrentProcessId()) + ",\"providerpath\":\"" + jsonString(utf8(providerPath.data(), static_cast<int>(length))) + "\",\"nonce\":\"" + nonce + "\"}";
  pipeWrite(pipe.value, event, deadline);
  const auto acknowledgement = pipeRead(pipe.value, deadline);
  require(acknowledgement == "{\"ack\":\"" + nonce + "\"}", "invalid containment test acknowledgement");
}
#else
void barrier() {}
#endif
void replace(Handle& parent, Handle& source, const std::string& target) {
  directory(parent); active(source);
  require(!source.directory && source.writable && !source.consumed && parent.authority == source.authority && sameIdentity(identity(parent), source.parentIdentity), "private sibling from this parent required");
  auto named = openFile(parent, source.name, false);
  require(sameIdentity(identity(*named), identity(source)), "private sibling identity changed");
  try { auto destination = openFile(parent, target, false); }
  catch (const std::system_error& error) { if (error.code() != std::errc::no_such_file_or_directory) throw; }
  barrier(); // Test-only final-use boundary; absent in the release binary.
  // The destination name is attacker-controlled until the final handle-relative use.
  // Reopen it after the test boundary so a newly substituted reparse entry cannot
  // be replaced as though the pre-barrier observation still applied.
  try { auto destination = openFile(parent, target, false); }
  catch (const std::system_error& error) { if (error.code() != std::errc::no_such_file_or_directory) throw; }
  auto name = wide(target);
  // SDK FILE_RENAME_INFO matches the documented NT FILE_RENAME_INFORMATION layout.
  // Win32 SetFileInformationByHandle does not document relative RootDirectory support.
  static_assert(sizeof(HANDLE) == 8 && offsetof(FILE_RENAME_INFO, RootDirectory) == 8 && offsetof(FILE_RENAME_INFO, FileName) == 20);
  const size_t size = sizeof(FILE_RENAME_INFO) + name.size() * sizeof(wchar_t);
  std::vector<uint64_t> storage((size + 7) / 8, 0);
  auto info = reinterpret_cast<FILE_RENAME_INFO*>(storage.data());
  info->Flags = FILE_RENAME_FLAG_REPLACE_IF_EXISTS | FILE_RENAME_FLAG_POSIX_SEMANTICS;
  info->RootDirectory = parent.value; info->FileNameLength = static_cast<DWORD>(name.size() * sizeof(wchar_t));
  std::memcpy(info->FileName, name.data(), info->FileNameLength);
  IO_STATUS_BLOCK io{};
  // Documented FILE_INFORMATION_CLASS: FileRenameInformationEx = 65 (not a bypass-access class).
  ntCheck(systemFunction<NtSet>("NtSetInformationFile")(source.value, &io, info, static_cast<ULONG>(size), static_cast<FILE_INFORMATION_CLASS>(65)), "NtSetInformationFile rename");
  source.consumed = true; source.writable = false;
}
void publishDirectory(Handle& parent, Handle& source, const std::string& target) {
  directory(parent); directory(source);
  require(!source.root && !source.consumed && parent.authority == source.authority &&
    sameIdentity(identity(parent), source.parentIdentity), "private sibling directory required");
  require(target != source.name, "source and target must differ");
  auto named = openDirectory(parent, source.name, false);
  require(sameIdentity(identity(*named), identity(source)), "publication source changed");
  auto name = wide(target);
  static_assert(sizeof(HANDLE) == 8 && offsetof(FILE_RENAME_INFO, RootDirectory) == 8 && offsetof(FILE_RENAME_INFO, FileName) == 20);
  const size_t size = sizeof(FILE_RENAME_INFO) + name.size() * sizeof(wchar_t);
  std::vector<uint64_t> storage((size + 7) / 8, 0);
  auto info = reinterpret_cast<FILE_RENAME_INFO*>(storage.data());
  // Deliberately omit REPLACE_IF_EXISTS: a contended lock name must fail, never replace.
  info->Flags = FILE_RENAME_FLAG_POSIX_SEMANTICS;
  info->RootDirectory = parent.value; info->FileNameLength = static_cast<DWORD>(name.size() * sizeof(wchar_t));
  std::memcpy(info->FileName, name.data(), info->FileNameLength);
  IO_STATUS_BLOCK io{};
  ntCheck(systemFunction<NtSet>("NtSetInformationFile")(source.value, &io, info, static_cast<ULONG>(size), static_cast<FILE_INFORMATION_CLASS>(65)), "NtSetInformationFile exclusive directory rename");
  source.consumed = true;
}
void unlink(Handle& parent, const std::string& name, bool isDirectory) {
  directory(parent);
  auto h = acquire(parent.value, wide(name), isDirectory, FILE_OPEN, DELETE, parent.authority);
  require(identity(parent).VolumeSerialNumber == identity(*h).VolumeSerialNumber, "cross-volume deletion rejected");
  FILE_DISPOSITION_INFO_EX info{FILE_DISPOSITION_FLAG_DELETE | FILE_DISPOSITION_FLAG_POSIX_SEMANTICS};
  if (!SetFileInformationByHandle(h->value, FileDispositionInfoEx, &info, sizeof(info))) fail("SetFileInformationByHandle delete");
  close(*h);
}
} // namespace contained
