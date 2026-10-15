declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: any;
    path?: string;
  }

  export function convertToHtml(options: MammothOptions): Promise<MammothResult>;
  export function extractRawText(options: MammothOptions): Promise<MammothResult>;
  export function convertToMarkdown(options: MammothOptions): Promise<MammothResult>;

  const mammoth: {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
    convertToMarkdown: typeof convertToMarkdown;
  };

  export default mammoth;
}
