module.exports = class Config {
  constructor() {
    this.token = "";
  }

  getAuth() {
    return JSON.stringify({
        op: 2,
        d: {
          token: this.token,
          capabilities: 125,
          properties: {
            os: "Windows",
            browser: "Chrome",
            device: "",
            system_locale: "th-TH",
            browser_user_agent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36",
            browser_version: "95.0.4638.54",
            os_version: "10",
            referrer: "",
            referring_domain: "",
            referrer_current: "",
            referring_domain_current: "",
            release_channel: "stable",
            client_build_number: 102604,
            client_event_source: null,
          },
          presence: {
            status: "online",
            since: 0,
            activities: [],
            afk: false,
          },
          compress: false,
          client_state: {
            guild_hashes: {},
            highest_last_message_id: "0",
            read_state_version: 0,
            user_guild_settings_version: -1,
            user_settings_version: -1,
          },
        },
      })
  }
}
