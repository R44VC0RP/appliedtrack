declare module 'hunterio' {
  interface HunterSDKOptions {
    domain: string;
  }

  class HunterSDK {
    constructor(apiKey: string);
    domainSearch(options: HunterSDKOptions, callback: (error: any, response: any) => void): void;
  }

  export default HunterSDK;
}
