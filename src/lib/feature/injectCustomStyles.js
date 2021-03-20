import CSSInjector from "../generic/cssInjector";

import notyfCSS from 'notyf/notyf.min.css';
import smartBasketCSS from '../../static/style.css';

export function injectCustomStyles(document) {
    const externalStylesheets = [smartBasketCSS, notyfCSS];
    new CSSInjector(document).injectMultiple(externalStylesheets);
}
