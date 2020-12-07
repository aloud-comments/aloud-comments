import showdown from 'showdown';
export declare class ShowdownParser {
  mdConverter: showdown.Converter;
  parse(md: string): string;
}
