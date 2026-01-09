declare module 'africastalking' {
  interface SMSOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SMSResult {
    SMSMessageData: {
      Message: string;
      Recipients: Array<{
        statusCode: number;
        number: string;
        cost: string;
        status: string;
        messageId: string;
      }>;
    };
  }

  interface SMS {
    send(options: SMSOptions): Promise<SMSResult>;
  }

  interface AfricasTalkingConfig {
    apiKey: string;
    username: string;
  }

  interface AfricasTalkingClient {
    SMS: SMS;
  }

  function AfricasTalking(config: AfricasTalkingConfig): AfricasTalkingClient;

  export default AfricasTalking;
}

