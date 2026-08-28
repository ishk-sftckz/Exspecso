#include <node_api.h>
#include <algorithm>
#include <cctype>
#include <cstdint>
#include <string>
#if defined(_WIN32)
#include "contained-fs-win.cc"
#else
#include "contained-fs-posix.cc"
#endif

namespace {
const napi_type_tag capabilityTag{0x495c9f976b1846e3ULL, 0xacac71cb0f4743a1ULL};
void check(napi_status status) { if (status != napi_ok) throw std::runtime_error("Node-API operation failed"); }
napi_value undefined(napi_env env) { napi_value result; check(napi_get_undefined(env, &result)); return result; }
template<class F> napi_value guard(napi_env env, F body) {
  try { return body(); }
  catch (const std::system_error& error) {
    std::string code = "EXSPECSO_CONTAINMENT_IO";
    if (error.code().value() == ENOENT) code = "EXSPECSO_CONTAINMENT_ENOENT";
    napi_throw_error(env, code.c_str(), (code + ": " + error.what()).c_str());
  } catch (const std::exception& error) { napi_throw_error(env, "EXSPECSO_CONTAINMENT_INVALID", (std::string("EXSPECSO_CONTAINMENT_INVALID: ") + error.what()).c_str()); }
  catch (...) { napi_throw_error(env, "EXSPECSO_CONTAINMENT_INTERNAL", "native operation failed"); }
  return nullptr;
}
std::vector<napi_value> arguments(napi_env env, napi_callback_info info, size_t expected) {
  size_t count = expected + 1; std::vector<napi_value> args(count);
  check(napi_get_cb_info(env, info, &count, args.data(), nullptr, nullptr));
  contained::require(count == expected, "wrong argument count"); return args;
}
std::string string(napi_env env, napi_value value, bool component = true) {
  napi_valuetype type; check(napi_typeof(env, value, &type));
  contained::require(type == napi_string, "string required");
  size_t length = 0; check(napi_get_value_string_utf8(env, value, nullptr, 0, &length));
  contained::require(length > 0 && length <= (component ? 255 : 32768), "invalid name length");
  std::vector<char> bytes(length + 1); size_t copied = 0;
  check(napi_get_value_string_utf8(env, value, bytes.data(), bytes.size(), &copied));
  std::string s(bytes.data(), copied); contained::require(s.find('\0') == std::string::npos, "NUL is forbidden");
  if (component) {
    contained::require(s != "." && s != ".." && s.find_first_of("/\\:<>\"|?*") == std::string::npos, "invalid component");
    // Spaces within names are portable; trailing spaces/dots and device names are not.
    contained::require(s.back() != '.' && s.back() != ' ', "invalid component suffix");
    auto device = s.substr(0, s.find('.'));
    std::transform(device.begin(), device.end(), device.begin(), [](unsigned char c) { return static_cast<char>(std::toupper(c)); });
    contained::require(device != "CON" && device != "PRN" && device != "AUX" && device != "NUL" &&
      !(device.size() == 4 && (device.rfind("COM", 0) == 0 || device.rfind("LPT", 0) == 0) && device[3] >= '1' && device[3] <= '9'), "reserved device name");
    if (device.rfind("COM", 0) == 0 || device.rfind("LPT", 0) == 0) {
      auto suffix = device.substr(3);
      contained::require(suffix != "\xc2\xb9" && suffix != "\xc2\xb2" && suffix != "\xc2\xb3", "reserved device alias");
    }
    for (unsigned char c : s) contained::require(c >= 32, "control character forbidden");
  }
  return s;
}
contained::Handle& handle(napi_env env, napi_value value) {
  bool matches = false; check(napi_check_object_type_tag(env, value, &capabilityTag, &matches));
  contained::require(matches, "opaque capability required");
  void* raw = nullptr; check(napi_unwrap(env, value, &raw)); contained::require(raw != nullptr, "invalid capability");
  return *static_cast<contained::Handle*>(raw);
}
void finalize(napi_env, void* data, void*) { delete static_cast<contained::Handle*>(data); }
napi_value wrap(napi_env env, contained::Owned h) {
  napi_value value; check(napi_create_object(env, &value));
  check(napi_type_tag_object(env, value, &capabilityTag));
  check(napi_wrap(env, value, h.get(), finalize, nullptr, nullptr)); h.release();
  check(napi_object_freeze(env, value)); return value;
}
napi_value OpenRoot(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,1); return wrap(e,contained::openRoot(string(e,a[0],false))); }); }
napi_value OpenDirectory(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,3); bool create; check(napi_get_value_bool(e,a[2],&create)); return wrap(e,contained::openDirectory(handle(e,a[0]),string(e,a[1]),create)); }); }
napi_value OpenFile(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,3); bool create; check(napi_get_value_bool(e,a[2],&create)); return wrap(e,contained::openFile(handle(e,a[0]),string(e,a[1]),create)); }); }
napi_value Read(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,1); auto bytes=contained::read(handle(e,a[0])); napi_value v; check(napi_create_buffer_copy(e,bytes.size(),bytes.data(),nullptr,&v)); return v; }); }
napi_value Write(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,2); bool buffer; check(napi_is_buffer(e,a[1],&buffer)); contained::require(buffer,"Buffer required"); void* bytes; size_t size; check(napi_get_buffer_info(e,a[1],&bytes,&size)); contained::write(handle(e,a[0]),bytes,size); return undefined(e); }); }
napi_value Sync(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,1); bool result=contained::sync(handle(e,a[0])); napi_value v; check(napi_get_boolean(e,result,&v)); return v; }); }
napi_value Close(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,1); contained::close(handle(e,a[0])); return undefined(e); }); }
napi_value List(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,1); auto names=contained::list(handle(e,a[0])); std::sort(names.begin(),names.end()); napi_value v; check(napi_create_array_with_length(e,names.size(),&v)); for(size_t n=0;n<names.size();n++) { napi_value s; check(napi_create_string_utf8(e,names[n].data(),names[n].size(),&s)); check(napi_set_element(e,v,n,s)); } return v; }); }
napi_value Replace(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,3); contained::replace(handle(e,a[0]),handle(e,a[1]),string(e,a[2])); return undefined(e); }); }
napi_value Unlink(napi_env e, napi_callback_info i) { return guard(e, [&] { auto a=arguments(e,i,3); bool dir; check(napi_get_value_bool(e,a[2],&dir)); contained::unlink(handle(e,a[0]),string(e,a[1]),dir); return undefined(e); }); }
napi_value Stat(napi_env e, napi_callback_info i) { return guard(e, [&] {
  auto a=arguments(e,i,1); auto st=contained::metadata(handle(e,a[0])); napi_value v;
  check(napi_create_object(e,&v));
  for(auto field : {std::pair<const char*,uint64_t>{"device",st.st_dev},{"size",static_cast<uint64_t>(st.st_size)}}) {
    napi_value n; check(napi_create_bigint_uint64(e,field.second,&n)); check(napi_set_named_property(e,v,field.first,n));
  }
  napi_value inode;
#if defined(_WIN32)
  const uint64_t words[] = {st.st_ino, st.inodeHigh};
  check(napi_create_bigint_words(e,0,2,words,&inode));
#else
  check(napi_create_bigint_uint64(e,st.st_ino,&inode));
#endif
  check(napi_set_named_property(e,v,"inode",inode)); return v;
}); }
napi_value Init(napi_env env, napi_value exports) {
  return guard(env,[&] {
    for(auto method : {std::pair<const char*,napi_callback>{"openRoot",OpenRoot},{"openDirectory",OpenDirectory},{"openFile",OpenFile},{"read",Read},{"write",Write},{"sync",Sync},{"close",Close},{"list",List},{"replace",Replace},{"unlink",Unlink},{"stat",Stat}}) {
      napi_value fn; check(napi_create_function(env,method.first,NAPI_AUTO_LENGTH,method.second,nullptr,&fn)); check(napi_set_named_property(env,exports,method.first,fn));
    }
    napi_value variant;
#if defined(EXSPECSO_CONTAINMENT_TEST)
    check(napi_create_string_utf8(env,"test",NAPI_AUTO_LENGTH,&variant));
#else
    check(napi_create_string_utf8(env,"release",NAPI_AUTO_LENGTH,&variant));
#endif
    check(napi_set_named_property(env,exports,"variant",variant));
    check(napi_object_freeze(env,exports)); return exports;
  });
}
} // namespace
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
