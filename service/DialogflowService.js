
const dialogflow = require("dialogflow");

class DialogflowService {
  constructor(projectId, sessionId, languageCode) {
    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionPath = this.sessionClient.sessionPath(projectId, sessionId);
    this.languageCode = languageCode;
  }

  async detectTextIntent(text) {
    const request = {
      session: this.sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: this.languageCode,
        },
      },
    };

    try {
      const [response] = await this.sessionClient.detectIntent(request);
      return response.queryResult;
    } catch (error) {
      console.error("Error detecting text intent:", error);
      throw error;
    }
  }
}

module.exports = DialogflowService;
