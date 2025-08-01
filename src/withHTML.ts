import { useChannel } from "storybook/internal/preview-api";
import type {
  Renderer,
  PartialStoryFn as StoryFunction,
} from "storybook/internal/types";
import { EVENTS } from "./constants";
import { Parameters } from "./types";

import prettier from 'prettier/standalone';
import parserHtml from 'prettier/plugins/html';

export const withHTML = (
  storyFn: StoryFunction<Renderer>,
  {
    parameters: { html: parameters = {} } = {},
  }: { parameters?: { html?: Parameters } },
) => {
  const emit = useChannel({});

  setTimeout( async () => {
    const rootSelector = parameters.root || "#storybook-root, #root";
    const root = document.querySelector(rootSelector);
    let code: string = root ? root.innerHTML : `${rootSelector} not found.`;

    const { removeEmptyComments, removeComments, transform } = parameters;
    if (removeEmptyComments) {
      code = code.replace(/<!--\s*-->/g, "");
    }
    if (removeComments === true) {
      code = code.replace(/<!--[\S\s]*?-->/g, "");
    } else if (removeComments instanceof RegExp) {
      code = code.replace(/<!--([\S\s]*?)-->/g, (match, p1) =>
        removeComments.test(p1) ? "" : match,
      );
    }

    try {
      code = await prettier.format(code, {
        parser: 'html',
        plugins: [parserHtml],
      });
    } catch (error) {
      console.error("Prettier formatting error:", error);
      // If prettier fails, we still want to emit the code
      // without formatting.
      code = code;      
    }
    
    if (typeof transform === "function") {
      try {
        code = transform(code);
      } catch (e) {
        console.error(e);
      }
    }
    emit(EVENTS.CODE_UPDATE, { code, options: parameters });
  }, 0);

  return storyFn();
};
