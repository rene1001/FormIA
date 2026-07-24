export interface FormQuestion {
  title: string;
  description?: string;
  type: "RADIO" | "CHECKBOX" | "DROP_DOWN" | "TEXT" | "PARAGRAPH";
  required: boolean;
  options?: string[];
}

export interface FormStructure {
  title: string;
  description: string;
  questions: FormQuestion[];
}

export interface GoogleFormFile {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface FormResponse {
  responseId: string;
  createTime: string;
  answers: {
    [questionId: string]: {
      questionId: string;
      textAnswers: {
        answers: Array<{
          value: string;
        }>;
      };
    };
  };
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  items: Array<{
    itemId: string;
    title: string;
    description?: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
        choiceQuestion?: {
          type: "RADIO" | "CHECKBOX" | "DROP_DOWN";
          options: Array<{ value: string }>;
        };
        textQuestion?: {
          paragraph?: boolean;
        };
      };
    };
  }>;
  responderUri: string;
}
