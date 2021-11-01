// To parse this data:
//
//   const Convert = require("./file");
//
//   const ready = Convert.toReady(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
function toReady(json) {
    return cast(JSON.parse(json), r("Ready"));
}

function readyToJson(value) {
    return JSON.stringify(uncast(value, r("Ready")), null, 2);
}

function invalidValue(typ, val, key = '') {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ) {
    if (typ.jsonToJS === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ) {
    if (typ.jsToJSON === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val, typ, getProps, key = '') {
    function transformPrimitive(typ, val) {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs, val) {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases, val) {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ, val) {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val) {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props, additional, val) {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast(val, typ) {
    return transform(val, typ, jsonToJSProps);
}

function uncast(val, typ) {
    return transform(val, typ, jsToJSONProps);
}

function a(typ) {
    return { arrayItems: typ };
}

function u(...typs) {
    return { unionMembers: typs };
}

function o(props, additional) {
    return { props, additional };
}

function m(additional) {
    return { props: [], additional };
}

function r(name) {
    return { ref: name };
}

const typeMap = {
    "Ready": o([
        { json: "t", js: "t", typ: "" },
        { json: "s", js: "s", typ: 0 },
        { json: "op", js: "op", typ: 0 },
        { json: "d", js: "d", typ: r("D") },
    ], false),
    "D": o([
        { json: "v", js: "v", typ: 0 },
        { json: "users", js: "users", typ: a(r("UserElement")) },
        { json: "user_settings_proto", js: "user_settings_proto", typ: "" },
        { json: "user_settings", js: "user_settings", typ: r("UserSettings") },
        { json: "user_guild_settings", js: "user_guild_settings", typ: r("UserGuildSettings") },
        { json: "user", js: "user", typ: r("PurpleUser") },
        { json: "tutorial", js: "tutorial", typ: null },
        { json: "session_id", js: "session_id", typ: "" },
        { json: "relationships", js: "relationships", typ: a(r("Relationship")) },
        { json: "read_state", js: "read_state", typ: r("ReadState") },
        { json: "private_channels", js: "private_channels", typ: a(r("PrivateChannel")) },
        { json: "merged_members", js: "merged_members", typ: a(a(r("MergedMember"))) },
        { json: "guilds", js: "guilds", typ: a(r("Guild")) },
        { json: "guild_join_requests", js: "guild_join_requests", typ: a(r("GuildJoinRequest")) },
        { json: "guild_experiments", js: "guild_experiments", typ: a(a(u(a(u(a(a(a(u(a(u(a(u(a(""), 0, null, "")), r("PurpleGuildExperiment"))), 0)))), r("FluffyGuildExperiment"))), 0, null))) },
        { json: "geo_ordered_rtc_regions", js: "geo_ordered_rtc_regions", typ: a("") },
        { json: "friend_suggestion_count", js: "friend_suggestion_count", typ: 0 },
        { json: "experiments", js: "experiments", typ: a(a(0)) },
        { json: "country_code", js: "country_code", typ: "" },
        { json: "consents", js: "consents", typ: r("Consents") },
        { json: "connected_accounts", js: "connected_accounts", typ: a(r("ConnectedAccount")) },
        { json: "analytics_token", js: "analytics_token", typ: "" },
        { json: "_trace", js: "_trace", typ: a("") },
    ], false),
    "ConnectedAccount": o([
        { json: "visibility", js: "visibility", typ: 0 },
        { json: "verified", js: "verified", typ: true },
        { json: "type", js: "type", typ: "" },
        { json: "show_activity", js: "show_activity", typ: true },
        { json: "revoked", js: "revoked", typ: true },
        { json: "name", js: "name", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "friend_sync", js: "friend_sync", typ: true },
        { json: "access_token", js: "access_token", typ: u(undefined, "") },
    ], false),
    "Consents": o([
        { json: "personalization", js: "personalization", typ: r("Personalization") },
    ], false),
    "Personalization": o([
        { json: "consented", js: "consented", typ: true },
    ], false),
    "PurpleGuildExperiment": o([
        { json: "s", js: "s", typ: 0 },
        { json: "e", js: "e", typ: 0 },
    ], false),
    "FluffyGuildExperiment": o([
        { json: "k", js: "k", typ: a("") },
        { json: "b", js: "b", typ: 0 },
    ], false),
    "GuildJoinRequest": o([
        { json: "user_id", js: "user_id", typ: "" },
        { json: "rejection_reason", js: "rejection_reason", typ: null },
        { json: "last_seen", js: "last_seen", typ: null },
        { json: "guild_id", js: "guild_id", typ: "" },
        { json: "created_at", js: "created_at", typ: null },
        { json: "application_status", js: "application_status", typ: "" },
    ], false),
    "Guild": o([
        { json: "system_channel_flags", js: "system_channel_flags", typ: 0 },
        { json: "explicit_content_filter", js: "explicit_content_filter", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "banner", js: "banner", typ: u(null, "") },
        { json: "verification_level", js: "verification_level", typ: 0 },
        { json: "application_command_counts", js: "application_command_counts", typ: m(0) },
        { json: "nsfw_level", js: "nsfw_level", typ: 0 },
        { json: "description", js: "description", typ: u(null, "") },
        { json: "stickers", js: "stickers", typ: a(r("Sticker")) },
        { json: "features", js: "features", typ: a("") },
        { json: "premium_tier", js: "premium_tier", typ: 0 },
        { json: "afk_channel_id", js: "afk_channel_id", typ: u(null, "") },
        { json: "channels", js: "channels", typ: a(r("Channel")) },
        { json: "roles", js: "roles", typ: a(r("Role")) },
        { json: "joined_at", js: "joined_at", typ: Date },
        { json: "default_message_notifications", js: "default_message_notifications", typ: 0 },
        { json: "application_command_count", js: "application_command_count", typ: 0 },
        { json: "mfa_level", js: "mfa_level", typ: 0 },
        { json: "icon", js: "icon", typ: u(null, "") },
        { json: "stage_instances", js: "stage_instances", typ: a("any") },
        { json: "max_members", js: "max_members", typ: 0 },
        { json: "owner_id", js: "owner_id", typ: "" },
        { json: "afk_timeout", js: "afk_timeout", typ: 0 },
        { json: "system_channel_id", js: "system_channel_id", typ: u(null, "") },
        { json: "application_id", js: "application_id", typ: null },
        { json: "threads", js: "threads", typ: a("any") },
        { json: "guild_scheduled_events", js: "guild_scheduled_events", typ: a("any") },
        { json: "public_updates_channel_id", js: "public_updates_channel_id", typ: u(null, "") },
        { json: "id", js: "id", typ: "" },
        { json: "lazy", js: "lazy", typ: true },
        { json: "premium_progress_bar_enabled", js: "premium_progress_bar_enabled", typ: true },
        { json: "region", js: "region", typ: "" },
        { json: "large", js: "large", typ: true },
        { json: "max_video_channel_users", js: "max_video_channel_users", typ: 0 },
        { json: "discovery_splash", js: "discovery_splash", typ: u(null, "") },
        { json: "member_count", js: "member_count", typ: 0 },
        { json: "vanity_url_code", js: "vanity_url_code", typ: u(null, "") },
        { json: "rules_channel_id", js: "rules_channel_id", typ: u(null, "") },
        { json: "preferred_locale", js: "preferred_locale", typ: r("Locale") },
        { json: "splash", js: "splash", typ: u(null, "") },
        { json: "embedded_activities", js: "embedded_activities", typ: a("any") },
        { json: "premium_subscription_count", js: "premium_subscription_count", typ: 0 },
        { json: "emojis", js: "emojis", typ: a(r("Emoji")) },
        { json: "nsfw", js: "nsfw", typ: true },
        { json: "guild_hashes", js: "guild_hashes", typ: r("GuildHashes") },
    ], false),
    "Channel": o([
        { json: "type", js: "type", typ: 0 },
        { json: "position", js: "position", typ: 0 },
        { json: "permission_overwrites", js: "permission_overwrites", typ: a(r("PermissionOverwrite")) },
        { json: "parent_id", js: "parent_id", typ: u(undefined, u(null, "")) },
        { json: "nsfw", js: "nsfw", typ: u(undefined, true) },
        { json: "name", js: "name", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "topic", js: "topic", typ: u(undefined, u(null, "")) },
        { json: "rate_limit_per_user", js: "rate_limit_per_user", typ: u(undefined, 0) },
        { json: "last_message_id", js: "last_message_id", typ: u(undefined, u(null, "")) },
        { json: "user_limit", js: "user_limit", typ: u(undefined, 0) },
        { json: "rtc_region", js: "rtc_region", typ: u(undefined, u(null, "")) },
        { json: "bitrate", js: "bitrate", typ: u(undefined, 0) },
        { json: "last_pin_timestamp", js: "last_pin_timestamp", typ: u(undefined, u(Date, null)) },
        { json: "video_quality_mode", js: "video_quality_mode", typ: u(undefined, 0) },
        { json: "default_auto_archive_duration", js: "default_auto_archive_duration", typ: u(undefined, 0) },
    ], false),
    "PermissionOverwrite": o([
        { json: "type", js: "type", typ: r("Type") },
        { json: "id", js: "id", typ: "" },
        { json: "deny_new", js: "deny_new", typ: "" },
        { json: "deny", js: "deny", typ: 0 },
        { json: "allow_new", js: "allow_new", typ: "" },
        { json: "allow", js: "allow", typ: 0 },
    ], false),
    "Emoji": o([
        { json: "roles", js: "roles", typ: a("") },
        { json: "require_colons", js: "require_colons", typ: true },
        { json: "name", js: "name", typ: "" },
        { json: "managed", js: "managed", typ: true },
        { json: "id", js: "id", typ: "" },
        { json: "available", js: "available", typ: true },
        { json: "animated", js: "animated", typ: true },
    ], false),
    "GuildHashes": o([
        { json: "version", js: "version", typ: 0 },
        { json: "roles", js: "roles", typ: r("Channels") },
        { json: "metadata", js: "metadata", typ: r("Channels") },
        { json: "channels", js: "channels", typ: r("Channels") },
    ], false),
    "Channels": o([
        { json: "omitted", js: "omitted", typ: true },
        { json: "hash", js: "hash", typ: "" },
    ], false),
    "Role": o([
        { json: "unicode_emoji", js: "unicode_emoji", typ: u(undefined, null) },
        { json: "position", js: "position", typ: 0 },
        { json: "permissions_new", js: "permissions_new", typ: "" },
        { json: "permissions", js: "permissions", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "mentionable", js: "mentionable", typ: true },
        { json: "managed", js: "managed", typ: true },
        { json: "id", js: "id", typ: "" },
        { json: "icon", js: "icon", typ: u(undefined, u(null, "")) },
        { json: "hoist", js: "hoist", typ: true },
        { json: "color", js: "color", typ: 0 },
        { json: "tags", js: "tags", typ: u(undefined, r("Tags")) },
    ], false),
    "Tags": o([
        { json: "bot_id", js: "bot_id", typ: u(undefined, "") },
        { json: "premium_subscriber", js: "premium_subscriber", typ: u(undefined, null) },
        { json: "integration_id", js: "integration_id", typ: u(undefined, "") },
    ], false),
    "Sticker": o([
        { json: "type", js: "type", typ: 0 },
        { json: "tags", js: "tags", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "id", js: "id", typ: "" },
        { json: "guild_id", js: "guild_id", typ: "" },
        { json: "format_type", js: "format_type", typ: 0 },
        { json: "description", js: "description", typ: u(null, "") },
        { json: "available", js: "available", typ: true },
        { json: "asset", js: "asset", typ: "" },
    ], false),
    "MergedMember": o([
        { json: "user_id", js: "user_id", typ: "" },
        { json: "roles", js: "roles", typ: a("") },
        { json: "premium_since", js: "premium_since", typ: u(undefined, null) },
        { json: "pending", js: "pending", typ: u(undefined, true) },
        { json: "nick", js: "nick", typ: u(undefined, u(null, "")) },
        { json: "mute", js: "mute", typ: true },
        { json: "joined_at", js: "joined_at", typ: Date },
        { json: "is_pending", js: "is_pending", typ: u(undefined, true) },
        { json: "hoisted_role", js: "hoisted_role", typ: u(null, "") },
        { json: "deaf", js: "deaf", typ: true },
        { json: "avatar", js: "avatar", typ: u(undefined, null) },
    ], false),
    "PrivateChannel": o([
        { json: "type", js: "type", typ: 0 },
        { json: "recipient_ids", js: "recipient_ids", typ: a("") },
        { json: "last_message_id", js: "last_message_id", typ: u(null, "") },
        { json: "id", js: "id", typ: "" },
    ], false),
    "ReadState": o([
        { json: "version", js: "version", typ: 0 },
        { json: "partial", js: "partial", typ: true },
        { json: "entries", js: "entries", typ: a(r("ReadStateEntry")) },
    ], false),
    "ReadStateEntry": o([
        { json: "mention_count", js: "mention_count", typ: 0 },
        { json: "last_pin_timestamp", js: "last_pin_timestamp", typ: Date },
        { json: "last_message_id", js: "last_message_id", typ: u(0, "") },
        { json: "id", js: "id", typ: "" },
    ], false),
    "Relationship": o([
        { json: "user_id", js: "user_id", typ: "" },
        { json: "type", js: "type", typ: 0 },
        { json: "nickname", js: "nickname", typ: null },
        { json: "id", js: "id", typ: "" },
    ], false),
    "PurpleUser": o([
        { json: "verified", js: "verified", typ: true },
        { json: "username", js: "username", typ: "" },
        { json: "purchased_flags", js: "purchased_flags", typ: 0 },
        { json: "premium", js: "premium", typ: true },
        { json: "phone", js: "phone", typ: "" },
        { json: "nsfw_allowed", js: "nsfw_allowed", typ: true },
        { json: "mobile", js: "mobile", typ: true },
        { json: "mfa_enabled", js: "mfa_enabled", typ: true },
        { json: "id", js: "id", typ: "" },
        { json: "flags", js: "flags", typ: 0 },
        { json: "email", js: "email", typ: "" },
        { json: "discriminator", js: "discriminator", typ: "" },
        { json: "desktop", js: "desktop", typ: true },
        { json: "bio", js: "bio", typ: "" },
        { json: "banner_color", js: "banner_color", typ: "" },
        { json: "banner", js: "banner", typ: null },
        { json: "avatar", js: "avatar", typ: "" },
        { json: "accent_color", js: "accent_color", typ: 0 },
    ], false),
    "UserGuildSettings": o([
        { json: "version", js: "version", typ: 0 },
        { json: "partial", js: "partial", typ: true },
        { json: "entries", js: "entries", typ: a(r("UserGuildSettingsEntry")) },
    ], false),
    "UserGuildSettingsEntry": o([
        { json: "version", js: "version", typ: 0 },
        { json: "suppress_roles", js: "suppress_roles", typ: true },
        { json: "suppress_everyone", js: "suppress_everyone", typ: true },
        { json: "muted", js: "muted", typ: true },
        { json: "mute_config", js: "mute_config", typ: null },
        { json: "mobile_push", js: "mobile_push", typ: true },
        { json: "message_notifications", js: "message_notifications", typ: 0 },
        { json: "hide_muted_channels", js: "hide_muted_channels", typ: true },
        { json: "guild_id", js: "guild_id", typ: "" },
        { json: "channel_overrides", js: "channel_overrides", typ: a(r("ChannelOverride")) },
    ], false),
    "ChannelOverride": o([
        { json: "muted", js: "muted", typ: true },
        { json: "mute_config", js: "mute_config", typ: u(r("MuteConfig"), null) },
        { json: "message_notifications", js: "message_notifications", typ: 0 },
        { json: "collapsed", js: "collapsed", typ: true },
        { json: "channel_id", js: "channel_id", typ: "" },
    ], false),
    "MuteConfig": o([
        { json: "selected_time_window", js: "selected_time_window", typ: u(0, null) },
        { json: "end_time", js: "end_time", typ: u(Date, null) },
    ], false),
    "UserSettings": o([
        { json: "inline_attachment_media", js: "inline_attachment_media", typ: true },
        { json: "show_current_game", js: "show_current_game", typ: true },
        { json: "friend_source_flags", js: "friend_source_flags", typ: r("FriendSourceFlags") },
        { json: "view_nsfw_guilds", js: "view_nsfw_guilds", typ: true },
        { json: "enable_tts_command", js: "enable_tts_command", typ: true },
        { json: "render_reactions", js: "render_reactions", typ: true },
        { json: "gif_auto_play", js: "gif_auto_play", typ: true },
        { json: "stream_notifications_enabled", js: "stream_notifications_enabled", typ: true },
        { json: "animate_emoji", js: "animate_emoji", typ: true },
        { json: "afk_timeout", js: "afk_timeout", typ: 0 },
        { json: "detect_platform_accounts", js: "detect_platform_accounts", typ: true },
        { json: "status", js: "status", typ: "" },
        { json: "explicit_content_filter", js: "explicit_content_filter", typ: 0 },
        { json: "custom_status", js: "custom_status", typ: null },
        { json: "default_guilds_restricted", js: "default_guilds_restricted", typ: true },
        { json: "theme", js: "theme", typ: "" },
        { json: "allow_accessibility_detection", js: "allow_accessibility_detection", typ: true },
        { json: "locale", js: "locale", typ: r("Locale") },
        { json: "native_phone_integration_enabled", js: "native_phone_integration_enabled", typ: true },
        { json: "guild_positions", js: "guild_positions", typ: a("") },
        { json: "timezone_offset", js: "timezone_offset", typ: 0 },
        { json: "friend_discovery_flags", js: "friend_discovery_flags", typ: 0 },
        { json: "contact_sync_enabled", js: "contact_sync_enabled", typ: true },
        { json: "disable_games_tab", js: "disable_games_tab", typ: true },
        { json: "guild_folders", js: "guild_folders", typ: a(r("GuildFolder")) },
        { json: "inline_embed_media", js: "inline_embed_media", typ: true },
        { json: "developer_mode", js: "developer_mode", typ: true },
        { json: "render_embeds", js: "render_embeds", typ: true },
        { json: "animate_stickers", js: "animate_stickers", typ: 0 },
        { json: "message_display_compact", js: "message_display_compact", typ: true },
        { json: "convert_emoticons", js: "convert_emoticons", typ: true },
        { json: "passwordless", js: "passwordless", typ: true },
        { json: "restricted_guilds", js: "restricted_guilds", typ: a("any") },
    ], false),
    "FriendSourceFlags": o([
        { json: "all", js: "all", typ: true },
    ], false),
    "GuildFolder": o([
        { json: "name", js: "name", typ: null },
        { json: "id", js: "id", typ: u(0, null) },
        { json: "guild_ids", js: "guild_ids", typ: a("") },
        { json: "color", js: "color", typ: u(0, null) },
    ], false),
    "UserElement": o([
        { json: "username", js: "username", typ: "" },
        { json: "public_flags", js: "public_flags", typ: u(undefined, 0) },
        { json: "id", js: "id", typ: "" },
        { json: "discriminator", js: "discriminator", typ: "" },
        { json: "avatar", js: "avatar", typ: u(null, "") },
        { json: "bot", js: "bot", typ: u(undefined, true) },
        { json: "system", js: "system", typ: u(undefined, true) },
    ], false),
    "Type": [
        "member",
        "role",
    ],
    "Locale": [
        "en-US",
        "th",
    ],
};

module.exports = {
    "readyToJson": readyToJson,
    "toReady": toReady,
};
