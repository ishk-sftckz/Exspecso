// Filesystem primitives only. Product policy, hashes and journals remain in TS.
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <dirent.h>
#include <dlfcn.h>
#include <fcntl.h>
#include <memory>
#include <poll.h>
#include <stdexcept>
#include <string>
#include <system_error>
#include <vector>
#include <sys/stat.h>
#include <unistd.h>
#if defined(__APPLE__)
#include <sys/mount.h>
#else
#include <sys/vfs.h>
#include <sys/syscall.h>
#include <linux/openat2.h>
#endif

namespace contained {
struct Authority { bool active = true; };
struct Handle {
  int fd = -1;
  bool directory = false;
  bool writable = false;
  bool root = false;
  bool consumed = false;
  dev_t parentDevice = 0;
  ino_t parentInode = 0;
  std::string name;
  std::shared_ptr<Authority> authority;
  ~Handle() { if (fd >= 0) ::close(fd); }
};
using Owned = std::unique_ptr<Handle>;
[[noreturn]] void fail(const char* operation) { throw std::system_error(errno, std::generic_category(), operation); }
void require(bool condition, const char* message) { if (!condition) throw std::invalid_argument(message); }
void active(Handle& h) { require(h.fd >= 0 && h.authority && h.authority->active, "closed capability"); }
void directory(Handle& h) { active(h); require(h.directory, "directory capability required"); }
struct stat metadata(Handle& h) {
  active(h); struct stat st{}; if (fstat(h.fd, &st) < 0) fail("fstat"); return st;
}
void sameFilesystem(Handle& parent, int fd) {
  struct stat a{}, b{};
  if (fstat(parent.fd, &a) < 0 || fstat(fd, &b) < 0) fail("fstat");
  require(a.st_dev == b.st_dev, "cross-device descent is unsupported");
}
int componentOpen(int parent, const char* name, int flags, mode_t mode = 0) {
#if defined(__linux__)
#if defined(EXSPECSO_CONTAINMENT_TEST)
  const bool fallback = std::getenv("EXSPECSO_TEST_OPENAT_FALLBACK") != nullptr;
#else
  const bool fallback = false;
#endif
  if (!fallback) {
    struct open_how how{};
    how.flags = static_cast<unsigned long long>(flags);
    how.mode = mode;
    how.resolve = RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS | RESOLVE_NO_XDEV;
    int fd = static_cast<int>(syscall(SYS_openat2, parent, name, &how, sizeof(how)));
    if (fd >= 0 || errno != ENOSYS) return fd;
  }
#endif
  return openat(parent, name, flags, mode);
}
Owned adopt(int fd, bool isDirectory, std::shared_ptr<Authority> authority) {
  if (fd < 0) fail("open");
  auto h = std::make_unique<Handle>(); h->fd = fd; h->directory = isDirectory; h->authority = std::move(authority);
  struct stat st{}; if (fstat(fd, &st) < 0) fail("fstat");
  require(isDirectory ? S_ISDIR(st.st_mode) : S_ISREG(st.st_mode), "unsupported object type");
  return h;
}
Owned openRoot(const std::string& path) {
  require(!path.empty() && path[0] == '/', "absolute root required");
  auto h = adopt(open("/", O_RDONLY | O_DIRECTORY | O_CLOEXEC), true, std::make_shared<Authority>());
  size_t start = 1;
  while (start < path.size()) {
    auto end = path.find('/', start); if (end == std::string::npos) end = path.size();
    auto part = path.substr(start, end - start);
    require(!part.empty() && part != "." && part != "..", "invalid root component");
    // Root acquisition may cross mountpoints; only its descendants are confined.
    h = adopt(openat(h->fd, part.c_str(), O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC), true, h->authority);
    start = end + 1;
  }
  struct statfs fs{}; if (fstatfs(h->fd, &fs) < 0) fail("fstatfs");
#if defined(__APPLE__)
  require(std::string(fs.f_fstypename) == "apfs", "unsupported filesystem (requires local APFS)");
#else
  require(fs.f_type == 0xef53, "unsupported filesystem (requires local ext4)");
#endif
  h->root = true; return h;
}
Owned openDirectory(Handle& parent, const std::string& name, bool create) {
  directory(parent);
  if (create && mkdirat(parent.fd, name.c_str(), 0700) < 0 && errno != EEXIST) fail("mkdirat");
  auto h = adopt(componentOpen(parent.fd, name.c_str(), O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC), true, parent.authority);
  sameFilesystem(parent, h->fd); return h;
}
Owned openFile(Handle& parent, const std::string& name, bool create) {
  directory(parent);
  int flags = O_NOFOLLOW | O_CLOEXEC | O_NONBLOCK | (create ? O_RDWR | O_CREAT | O_EXCL : O_RDONLY);
  auto h = adopt(componentOpen(parent.fd, name.c_str(), flags, create ? 0600 : 0), false, parent.authority);
  sameFilesystem(parent, h->fd);
  auto st = metadata(parent); h->parentDevice = st.st_dev; h->parentInode = st.st_ino;
  h->name = name; h->writable = create; return h;
}
std::vector<char> read(Handle& h) {
  active(h); require(!h.directory, "file capability required");
  auto st = metadata(h);
  constexpr size_t limit = 16 * 1024 * 1024;
  require(st.st_size >= 0 && static_cast<uint64_t>(st.st_size) <= limit, "file exceeds 16 MiB read limit");
  std::vector<char> bytes(static_cast<size_t>(st.st_size)); size_t offset = 0;
  while (offset < bytes.size()) {
    auto count = pread(h.fd, bytes.data() + offset, bytes.size() - offset, static_cast<off_t>(offset));
    if (count < 0) { if (errno == EINTR) continue; fail("pread"); }
    require(count != 0, "file changed while reading"); offset += static_cast<size_t>(count);
  }
  auto after = metadata(h);
  require(st.st_size == after.st_size, "file changed while reading");
  return bytes;
}
void write(Handle& h, const void* data, size_t length) {
  active(h); require(!h.directory && h.writable && !h.consumed, "writable private file required");
  require(length <= 16 * 1024 * 1024, "write exceeds 16 MiB limit");
  size_t offset = 0;
  while (offset < length) {
    auto count = pwrite(h.fd, static_cast<const char*>(data) + offset, length - offset, static_cast<off_t>(offset));
    if (count < 0) { if (errno == EINTR) continue; fail("pwrite"); }
    require(count > 0, "zero-length write"); offset += static_cast<size_t>(count);
  }
  if (ftruncate(h.fd, static_cast<off_t>(length)) < 0) fail("ftruncate private file");
}
bool sync(Handle& h) {
  active(h);
  if (fsync(h.fd) == 0) return true;
  if (h.directory && (errno == EINVAL || errno == ENOTSUP)) return false;
  fail("fsync");
}
std::vector<std::string> list(Handle& h) {
  directory(h);
  // An independent descriptor avoids changing the held capability's directory offset.
  int fd = openat(h.fd, ".", O_RDONLY | O_DIRECTORY | O_CLOEXEC);
  if (fd < 0) fail("open directory listing");
  DIR* raw = fdopendir(fd); if (!raw) { int saved = errno; ::close(fd); errno = saved; fail("fdopendir"); }
  std::unique_ptr<DIR, decltype(&closedir)> dir(raw, closedir);
  std::vector<std::string> entries;
  for (;;) {
    errno = 0; auto entry = readdir(dir.get());
    if (!entry) { if (errno) fail("readdir"); break; }
    std::string name(entry->d_name); if (name != "." && name != "..") entries.push_back(name);
  }
  return entries;
}
void barrier() {
#if defined(EXSPECSO_CONTAINMENT_TEST)
  static bool reached = false;
  const char* point = std::getenv("EXSPECSO_CONTAINMENT_TEST_OPERATION");
  const char* channel = std::getenv("EXSPECSO_CONTAINMENT_TEST_CHANNEL_ID");
  const char* controller = std::getenv("EXSPECSO_CONTAINMENT_TEST_CONTROLLER_PID");
  if (!point && !channel && !controller) return;
  require(!reached && point && channel && controller, "incomplete containment test activation");
  const std::string nonce(channel);
  require(std::strcmp(point, "replace:before") == 0 && nonce.size() == 64 &&
    std::all_of(nonce.begin(), nonce.end(), [](unsigned char c) { return std::isdigit(c) || (c >= 'a' && c <= 'f'); }) &&
    std::strlen(controller) > 0 && std::strlen(controller) <= 10 && controller[0] != '0' &&
    std::all_of(controller, controller + std::strlen(controller), [](unsigned char c) { return std::isdigit(c); }), "invalid containment test activation");
  reached = true;
  Dl_info image{};
  require(dladdr(reinterpret_cast<const void*>(&barrier), &image) != 0 && image.dli_fname, "cannot identify loaded test provider");
  std::string path;
  for (const unsigned char c : std::string(image.dli_fname)) {
    require(c >= 32, "unsupported control character in test provider path");
    if (c == '\\' || c == '"') path += '\\';
    path += static_cast<char>(c);
  }
  const std::string message = "{\"op\":\"replace:before\",\"childpid\":" + std::to_string(getpid()) + ",\"providerpath\":\"" + path + "\",\"nonce\":\"" + nonce + "\"}";
  size_t offset = 0;
  while (offset < message.size()) {
    auto count = ::write(3, message.data() + offset, message.size() - offset);
    if (count < 0) { if (errno == EINTR) continue; fail("test channel write"); }
    require(count > 0, "closed test channel"); offset += static_cast<size_t>(count);
  }
  pollfd pfd{4, POLLIN, 0};
  int ready; do { ready = poll(&pfd, 1, 10000); } while (ready < 0 && errno == EINTR);
  require(ready > 0, "test barrier timeout");
  const std::string expected = "{\"ack\":\"" + nonce + "\"}";
  std::array<char, 128> reply{};
  const auto count = ::read(4, reply.data(), reply.size());
  require(count == static_cast<ssize_t>(expected.size()) && std::string(reply.data(), static_cast<size_t>(count)) == expected, "invalid test acknowledgement");
#endif
}
void replace(Handle& parent, Handle& source, const std::string& target) {
  directory(parent); active(source);
  require(source.writable && !source.consumed && !source.directory, "private source required");
  const auto p = metadata(parent);
  require(parent.authority == source.authority && p.st_dev == source.parentDevice && p.st_ino == source.parentInode, "source belongs to another parent");
  require(target != source.name, "source and target must differ");
  barrier(); // Test-only final-use boundary; absent in the release binary.
  struct stat observed{};
  if (fstatat(parent.fd, source.name.c_str(), &observed, AT_SYMLINK_NOFOLLOW) < 0) fail("stat replacement source");
  const auto held = metadata(source);
  require(S_ISREG(observed.st_mode) && observed.st_dev == held.st_dev && observed.st_ino == held.st_ino, "replacement source changed");
  if (fstatat(parent.fd, target.c_str(), &observed, AT_SYMLINK_NOFOLLOW) == 0) {
    require(S_ISREG(observed.st_mode), "replacement destination is not a regular file");
  } else if (errno != ENOENT) fail("stat replacement destination");
  if (renameat(parent.fd, source.name.c_str(), parent.fd, target.c_str()) < 0) fail("renameat");
  source.consumed = true; source.writable = false;
}
void unlink(Handle& parent, const std::string& name, bool isDirectory) {
  directory(parent);
  struct stat st{}; if (fstatat(parent.fd, name.c_str(), &st, AT_SYMLINK_NOFOLLOW) < 0) fail("stat removal");
  require(isDirectory ? S_ISDIR(st.st_mode) : S_ISREG(st.st_mode), "unexpected removal kind");
  if (unlinkat(parent.fd, name.c_str(), isDirectory ? AT_REMOVEDIR : 0) < 0) fail("unlinkat");
}
void close(Handle& h) {
  if (h.root && h.authority) h.authority->active = false;
  if (h.fd >= 0) { int fd = h.fd; h.fd = -1; if (::close(fd) < 0) fail("close"); }
}
} // namespace contained
