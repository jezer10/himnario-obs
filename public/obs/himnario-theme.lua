-- OBS 29+ / obs-websocket 5.x. No external Lua modules or extra ports.
-- FFI declarations follow libobs/callback/calldata.h and
-- obsproject/obs-websocket/lib/obs-websocket-api.h (API version 2+).
local obs = obslua
local ffi = require('ffi')
ffi.cdef[[
typedef struct { unsigned char *stack; size_t size; size_t capacity; bool fixed; } hymn_calldata;
typedef struct { unsigned int status_code; char *comment; char *response_data; } hymn_response;
void *obs_get_proc_handler(void);
bool proc_handler_call(void *, const char *, hymn_calldata *);
bool calldata_get_data(const hymn_calldata *, const char *, void *, size_t);
void calldata_set_data(hymn_calldata *, const char *, const void *, size_t);
void bfree(void *);
]]
local lib
local active = false

local function pointer(cd, key)
    local out = ffi.new('void *[1]')
    if lib.calldata_get_data(cd, key, out, ffi.sizeof(out)) then return out[0] end
    return nil
end

local function broadcast(json)
    local cd = ffi.new('hymn_calldata[1]')
    local found = lib.proc_handler_call(lib.obs_get_proc_handler(), 'obs_websocket_api_get_ph', cd)
    local handler = found and pointer(cd, 'ph') or nil
    lib.bfree(cd[0].stack)
    if handler == nil then return end
    cd = ffi.new('hymn_calldata[1]')
    local request = 'BroadcastCustomEvent'
    lib.calldata_set_data(cd, 'request_type', request, #request + 1)
    lib.calldata_set_data(cd, 'request_data', json, #json + 1)
    lib.proc_handler_call(handler, 'call_request', cd)
    local response = ffi.cast('hymn_response *', pointer(cd, 'response'))
    if response ~= nil then
        lib.bfree(response.comment)
        lib.bfree(response.response_data)
        lib.bfree(response)
    end
    lib.bfree(cd[0].stack)
end

local function publish()
    if not active then return end
    local config = obs.obs_frontend_get_user_config and obs.obs_frontend_get_user_config()
        or obs.obs_frontend_get_global_config()
    local id = obs.config_get_string(config, 'Appearance', 'Theme')
    if not id or id == '' then id = obs.config_get_string(config, 'General', 'CurrentTheme3') or '' end
    local legacy = {Yami='com.obsproject.Yami', Dark='com.obsproject.Yami',
        Light='com.obsproject.Yami.Light', Grey='com.obsproject.Yami.Grey',
        Acri='com.obsproject.Yami.Acri', Rachni='com.obsproject.Yami.Rachni'}
    id = legacy[id] or id
    local event = obs.obs_data_create()
    obs.obs_data_set_string(event, 'type', 'himnario.theme')
    obs.obs_data_set_int(event, 'version', 1)
    obs.obs_data_set_bool(event, 'dark', obs.obs_frontend_is_theme_dark())
    obs.obs_data_set_string(event, 'id', id)
    local request = obs.obs_data_create()
    obs.obs_data_set_obj(request, 'eventData', event)
    local ok, err = pcall(broadcast, obs.obs_data_get_json(request))
    obs.obs_data_release(request)
    obs.obs_data_release(event)
    if not ok then
        active = false
        obs.script_log(obs.LOG_WARNING, 'Himnario: sincronización detenida: ' .. tostring(err))
    end
end

local function on_event(event)
    if event == obs.OBS_FRONTEND_EVENT_THEME_CHANGED or event == obs.OBS_FRONTEND_EVENT_FINISHED_LOADING then
        -- Publish on the next timer tick, after OBS has saved the theme ID.
        obs.timer_add(publish_after_change, 100)
    end
end

function publish_after_change()
    obs.timer_remove(publish_after_change)
    publish()
end

function script_description()
    return 'Sincroniza el tema del Himnario con OBS. Activa el servidor WebSocket, conecta el panel y elige «Seguir tema de OBS». Requiere OBS 29 o posterior.'
end

function script_load()
    if not obs.obs_frontend_is_theme_dark then
        obs.script_log(obs.LOG_WARNING, 'Himnario requiere OBS 29 o posterior.')
        return
    end
    local ok, result = pcall(ffi.load, ffi.os == 'Windows' and 'obs' or 'libobs')
    if not ok then
        obs.script_log(obs.LOG_WARNING, 'No se pudo cargar libobs: ' .. tostring(result))
        return
    end
    lib = result
    active = true
    obs.obs_frontend_add_event_callback(on_event)
    -- Heartbeat also supplies the current theme to newly connected panels.
    obs.timer_add(publish, 3000)
    publish()
end

function script_unload()
    active = false
    obs.timer_remove(publish)
    obs.timer_remove(publish_after_change)
    obs.obs_frontend_remove_event_callback(on_event)
end
