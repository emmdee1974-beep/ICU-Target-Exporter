// ==UserScript==
// @name         ICU — I See You Target Exporter
// @namespace    https://greasyfork.org/users/loneblackbear
// @version      1.3.0
// @description  Copy visible Torn faction member XIDs into a clean comma-separated list for easy YATA importing.
// @author       LoneBlackBear / ChatGPT
// @match        https://www.torn.com/factions.php*
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const BOX_ID = 'icu-xid-copy-box';
    const STORAGE_KEY = 'icu_own_xid';
    const COLLAPSED_KEY = 'icu_collapsed';

    const DONATION_URL = 'https://www.torn.com/profiles.php?XID=3163918';

    function getSavedOwnXid() {
        return localStorage.getItem(STORAGE_KEY) || '';
    }

    function saveOwnXid(xid) {
        localStorage.setItem(STORAGE_KEY, xid.trim());
    }

    function isCollapsed() {
        return localStorage.getItem(COLLAPSED_KEY) === '1';
    }

    function setCollapsed(value) {
        localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0');
    }

    function collectXids() {
        const found = new Set();

        document.querySelectorAll('a[href*="XID="]').forEach(a => {
            const href = a.getAttribute('href') || '';
            const match = href.match(/[?&]XID=(\d+)/i);

            if (match) {
                found.add(match[1]);
            }
        });

        const ownXid = getSavedOwnXid();

        if (ownXid) {
            found.delete(ownXid);
        }

        return [...found];
    }

    function copyText(text) {
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, 'text');
            return Promise.resolve();
        }

        return navigator.clipboard.writeText(text);
    }

    function baseStyle(box) {
        box.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(180deg,#141414,#0b0b0b);
            color: #f4d38a;
            border: 2px solid #b8872b;
            border-radius: 12px;
            box-shadow:
                0 0 18px rgba(0,0,0,.65),
                0 0 12px rgba(184,135,43,.15);
            padding: 10px;
            font: 13px Arial, sans-serif;
            min-width: 235px;
        `;
    }

    function makeButton(text, extra='') {
        const btn = document.createElement('button');

        btn.textContent = text;

        btn.style.cssText = `
            width:100%;
            cursor:pointer;
            padding:8px 10px;
            border-radius:6px;
            font-weight:bold;
            transition:.15s;
            ${extra}
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.02)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });

        return btn;
    }

    function makeBearButton() {
        const bear = document.createElement('a');

        bear.href = DONATION_URL;
        bear.target = '_blank';
        bear.title = 'Send LoneBlackBear a Xanax 🐻';

        bear.innerHTML = '🐻';

        bear.style.cssText = `
            position:absolute;
            top:6px;
            right:8px;
            text-decoration:none;
            font-size:18px;
            filter:drop-shadow(0 0 4px rgba(255,215,120,.4));
            transition:.15s;
        `;

        bear.addEventListener('mouseenter', () => {
            bear.style.transform = 'scale(1.15)';
        });

        bear.addEventListener('mouseleave', () => {
            bear.style.transform = 'scale(1)';
        });

        return bear;
    }

    function renderCollapsed(box) {
        setCollapsed(true);

        box.innerHTML = '';
        baseStyle(box);

        box.style.minWidth = '72px';
        box.style.padding = '7px';

        const btn = makeButton('ICU', `
            background: linear-gradient(#e2bd6d,#9c6b1d);
            color:#111;
            border:1px solid #ffe1a0;
        `);

        btn.addEventListener('click', () => {
            renderExpanded(box, 'Ready for another export.');
        });

        box.appendChild(btn);
        box.appendChild(makeBearButton());
    }

    function renderExpanded(box, statusText='comma separated export') {
        setCollapsed(false);

        box.innerHTML = '';
        baseStyle(box);

        const title = document.createElement('div');
        title.innerHTML = `
            <div style="font-size:18px;font-weight:bold;color:#ffd37a;">
                ICU
            </div>
            <div style="font-size:11px;color:#ccc;margin-top:-2px;">
                I See You
            </div>
        `;

        title.style.cssText = `
            text-align:center;
            margin-bottom:10px;
        `;

        const label = document.createElement('div');
        label.textContent = 'Ignore Your XID';
        label.style.cssText = `
            margin-bottom:4px;
            font-size:12px;
            color:#ddd;
        `;

        const input = document.createElement('input');

        input.type = 'text';
        input.placeholder = 'Enter your XID';
        input.value = getSavedOwnXid();

        input.style.cssText = `
            width:100%;
            box-sizing:border-box;
            margin-bottom:8px;
            padding:7px;
            border-radius:5px;
            border:1px solid #666;
            background:#1d1d1d;
            color:#fff;
        `;

        const saveBtn = makeButton('Save XID', `
            margin-bottom:8px;
            background:#333;
            color:#fff;
            border:1px solid #777;
        `);

        const copyBtn = makeButton('Copy XIDs', `
            margin-bottom:8px;
            background: linear-gradient(#e2bd6d,#9c6b1d);
            color:#111;
            border:1px solid #ffe1a0;
        `);

        const miniBtn = makeButton('Minimize', `
            background:#151515;
            color:#ffd37a;
            border:1px solid #7f6328;
        `);

        const status = document.createElement('div');

        status.textContent = statusText;

        status.style.cssText = `
            margin-top:8px;
            color:#ccc;
            text-align:center;
            font-size:12px;
        `;

        saveBtn.addEventListener('click', () => {
            const val = input.value.replace(/\D/g, '');

            input.value = val;

            saveOwnXid(val);

            status.textContent = val
                ? `Saved XID ${val}`
                : 'Cleared saved XID';

            status.style.color = '#80cfff';
        });

        copyBtn.addEventListener('click', async () => {
            const xids = collectXids();

            if (!xids.length) {
                status.textContent = 'No XIDs found.';
                status.style.color = '#ff7777';
                return;
            }

            const text = xids.join(',');

            await copyText(text);

            status.textContent = `Copied ${xids.length} XIDs`;
            status.style.color = '#80ff80';

            console.log('[ICU]', text);

            setTimeout(() => {
                renderCollapsed(box);
            }, 700);
        });

        miniBtn.addEventListener('click', () => {
            renderCollapsed(box);
        });

        box.appendChild(title);
        box.appendChild(label);
        box.appendChild(input);
        box.appendChild(saveBtn);
        box.appendChild(copyBtn);
        box.appendChild(miniBtn);
        box.appendChild(status);
        box.appendChild(makeBearButton());
    }

    function init() {
        if (document.getElementById(BOX_ID)) return;

        const box = document.createElement('div');

        box.id = BOX_ID;

        document.body.appendChild(box);

        if (isCollapsed()) {
            renderCollapsed(box);
        } else {
            renderExpanded(box);
        }
    }

    init();

    const observer = new MutationObserver(() => {
        if (!document.getElementById(BOX_ID)) {
            init();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

})();
