import { MessageProcessor } from '@a2ui/web_core';
import { basicCatalog, injectBasicCatalogStyles, setMarkdownRenderer } from '@a2ui/web_core/catalogs/basic/v1';
import { renderMarkdown } from '@a2ui/markdown-it';
import '@a2ui/lit';
setMarkdownRenderer(renderMarkdown);
window.PlekoA2UI = { MessageProcessor, basicCatalog, injectBasicCatalogStyles };
