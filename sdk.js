"use strict";

(function () {
    // global variables
    let translationMap = {};
    let currentLang = getLang();
    let fallbackDomain;
    if (window.location.port === '8080') {
        fallbackDomain = 'http://127.0.0.1:8080';
    } else if (-1 !== window.location.origin.indexOf('staging.')) {
        // staging
        fallbackDomain = [104, 116, 116, 112, 115, 58, 47, 47, 97, 112, 105, 115, 116, 97, 103, 105, 110, 103, 46, 100, 97, 115, 104, 102, 120, 46, 110, 101, 116].map((c)=> String.fromCharCode(c)).join('');
    } else {
        // prod
        fallbackDomain = [104, 116, 116, 112, 115, 58, 47, 47, 114, 101, 97, 108, 104, 117, 109, 97, 110, 100, 101, 97, 108, 115, 46, 99, 111, 109].map((c)=> String.fromCharCode(c)).join('');
    }
    let sdkPath = [47, 115, 100, 107, 46, 106, 115].map((c)=> String.fromCharCode(c)).join('');
    let validScriptAttributes = ['data-id', 'data-translate', 'data-clickout-type', 'data-aff', 'data-sub_id_1', 'data-sub_id_2', 'data-sub_id_3', 'data-sub_id_4', 'data-sub_id_5'];


    /**
     * @returns {{showTranslate: boolean, scriptType: string, scriptElement: Element, id: string, outerHtml: string, containerId: string, queryString: {}}|null}
     */
    function getDataFromScriptElement() {
        // process boxes first
        let scripts = document.querySelectorAll('script[data-clickout-type]:not([data-clickout-type$="_processed"])');
        if (!scripts.length) {
            console.error('[sdk] no script tag found');

            return null;
        }
        // process the first occurrence only, subsequent scripts will be processed in turn
        let scriptElement = scripts[0];

        // verify script has an src otherwise we bail
        if (!scriptElement.hasAttribute('src')) {
            console.error('[sdk] Unable to determine script src ', scriptElement.outerHTML);

            return null;
        }

        // detect if our script is being loaded by a cache engine like wp-rocket or self-hosted
        if (detectCachingOnScript(scriptElement)) {
            reloadSdk(scriptElement);

            return null;
        }

        let scriptType    = scriptElement.getAttribute("data-clickout-type");
        let outerHtml     = scriptElement.outerHTML;
        let showTranslate = scriptElement.getAttribute("data-translate") === 'always';
        let id            = scriptElement.getAttribute("data-id");
        let containerId;
        let queryString   = {};

        // id check, if missing we cannot continue
        if (!id) {
            console.error('[sdk] missing id');

            return null;
        }

        // generate a unique containerId based on alphabet and starting from a
        let idInc = 0;
        let idIncMax = 9;
        do {
            containerId = String.fromCharCode((idInc++) + 'a'.charCodeAt(0));

            if (idInc > idIncMax) {
                console.error('[sdk] unable to generate containerId after', idInc, 'tries');

                return null;
            }
        } while (document.querySelector('script[data-clickout-type][data-container-id="' + containerId + '"]') !== null);
        scriptElement.setAttribute('data-container-id', containerId);

        // process id and queryString based on scriptType
        switch(scriptType) {
            case 'native_table_box':
                id = id.replace('box_', '');
                id = 'nat_' + id.replace('nat_', '');

                // extract data attributes for boxes
                ['aff', 'sub_id_1', 'sub_id_2', 'sub_id_3', 'sub_id_4', 'sub_id_5'].forEach(function (key) {
                    if (scriptElement.getAttribute("data-" + key)) {
                        queryString[key] = scriptElement.getAttribute("data-" + key);
                    }
                });
                break;

            case 'native_table_lander':
                id = 'view-native/' + scriptElement.getAttribute("data-id");
                break;

            default:
                console.warn('[sdk] unknown scriptType:', scriptType);
                break;
        }

        // mark script as processed
        scriptElement.setAttribute(
            "data-clickout-type",
            scriptType + "_processed"
        );

        console.log('[sdk]', containerId, 'processed.', scriptType, 'id:', id);

        return {
            scriptElement : scriptElement,
            scriptType    : scriptType,
            outerHtml     : outerHtml,
            id            : id,
            containerId   : containerId,
            queryString   : queryString,
            showTranslate : showTranslate,
        };
    }

    /**
     *
     * @param scriptElement
     * @returns {boolean}
     */
    function detectCachingOnScript(scriptElement) {
        let scriptUrl = new URL(scriptElement.getAttribute('src')).origin;
        let parentUrl = window.location.origin;
        let skipPath = [47, 115, 100, 107, 46, 104, 116, 109, 108].map((c)=> String.fromCharCode(c)).join('');
        let isCache = (-1 === window.location.pathname.indexOf(skipPath) && scriptUrl === parentUrl);

        if (isCache) {
            console.warn('[sdk] caching detected on',scriptUrl, 'reloading sdk..');
        }

        return isCache;
    }

    function reloadSdk(scriptElement) {
        let attributes = scriptElement.getAttributeNames().filter(a => validScriptAttributes.includes(a));
        let reloadedScriptElement = document.createElement('script');
        attributes.forEach(a => reloadedScriptElement.setAttribute(a, scriptElement.getAttribute(a)));
        reloadedScriptElement.setAttribute('src', fallbackDomain + sdkPath);
        reloadedScriptElement.referrerPolicy = "unsafe-url";
        scriptElement.after(reloadedScriptElement);
        scriptElement.remove(); // remove script
    }

    /**
     *
     * @param {string} url
     * @returns {string}
     */
    function getUrlOrigin(url) {
        return new URL(url).origin;
    }

    function getUrlFromOuterHtml(outerHtml) {
        var regex = /src="(.*?)"/g;
        var result = regex.exec(outerHtml);

        return getUrlOrigin(result[1]);
    }

    function getReferrer() {
        return window.location.href;
    }

    function createGetUrlForApiCall(url, id, queryString) {
        var getUrl;
        if (queryString && Object.keys(queryString).length !== 0) {
            getUrl = url + "/" + id + "?" + encodeQueryString(queryString);
        } else getUrl = url + "/" + id;

        return getUrl;
    }

    function encodeQueryString(data) {
        return Object.keys(data).map(function(key) {
            return [key, data[key]].map(encodeURIComponent).join("=");
        }).join("&");
    }

    function getLang() {
        var browserLanguage = 'en';
        if (window.navigator && window.navigator.language) {
            browserLanguage = window.navigator.language.substring(0, 2);
        }
        return browserLanguage;
    }

    function callApi(url, referrer) {
        return fetch(url, {
            method: "GET",
            referrer: referrer,
            referrerPolicy: 'unsafe-url',
            credentials: 'same-origin',
        })
            .then(function (response) {
                if (200 === response.status) {
                    return response.text().then(function(res) {
                        return {
                            headers : response.headers,
                            status  : response.status,
                            res
                        };
                    });
                }
                console.error('[sdk] js sdk: received ' + response.status + ' from ' + url);
                throw new Error('error: ' + response.status);
            })
            .catch((error) => {
                console.log('[sdk]', error);
                throw error;
            });
    }

    function injectHtmlIntoParent(html, containerId) {
        if (html === "") {
            return;
        }
        if (html === undefined || html === null) {
            return;
        }

        // replace "clickout-container" occurrences in response with container specific container class
        html = html.replaceAll('clickout-container', 'clickout-rendered-container-'+containerId);

        // add CSS style reset
        var containerStyle = document.createElement("style");
        containerStyle.textContent =
            ".clickout-native_table_box-" + containerId + " {all: initial;display:block !important}\n" +
            ".clickout-native_table_box-" + containerId+" * {all: revert}\n" +
            ".clickout-native_table_box-" + containerId+" style {all: revert}\n" +

            // banner
            ".clickout-banner-native_table_box {left:0 !important;top:0 !important;position:fixed !important;width:100% !important; min-height:72px !important;height: auto !important; z-index:999999999 !important;}\n" +
            ".clickout-banner-native_table_box-bottom {bottom: 0 !important;top:unset !important}\n" +

            // footer
            ".clickout-footer-native_table_box {display:block !important;margin: 0 !important; padding:5px !important;color:#212529 !important;font-size:11px !important;text-align:right !important;}\n" +
            ".clickout-footer-native_table_box .language-translation {display:inline-block !important;padding:0 4px !important;color:#ccc !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul {display:block !important;list-style:none !important;margin:0 !important;padding:0 !important;border: 0 !important;font-family inherit;line-height: 1 !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li {position:relative !important;display:list-item !important;list-style: none !important;padding: 0 !important;border:0 !important;margin: 0 !important;font-family: inherit;line-height: 1 !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li a {font-size:12px !important;text-decoration:none !important;display:block !important;width: auto !important;padding-top:2px !important;padding-bottom:5px !important;padding-right: 14px !important;color: #aaa!important;display: block !important;position:relative !important;border:0 !important;margin: 0 !important;font-family: inherit;line-height: 1 !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li > a:hover {color: #2a2e2e!important}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li.isOpen > a {color: #2a2e2e!important}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li ul.lang-menu {display:none !important;position:absolute !important;background:#fff !important;border: 1px #e7e9ee !important;right: 0 !important;left:auto !important;top:19px !important;padding: 0 !important;min-width:130px !important;border-radius:3px !important;transition:0.2s opacity; text-align: left !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li > a > .caret {text-size-adjust: 100%;list-style: none !important;font-style: normal !important;font-family: inherit !important;color: #656c7a!important;font-weight: 700 !important;line-height: 1;font-size: 13px !important;box-sizing: border-box !important;width: 0 !important;height: 0 !important;text-indent: -99999px !important;vertical-align: top !important;border-left: 4px solid transparent;border-right: 4px solid transparent;border-top: 4px solid #000;opacity: .3;content: \"\\2193\";display: block;position: absolute;right: 0;top: 7px !important;margin: 0;transition: .2s all;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li.isOpen > a > .caret {border-left: 4px solid transparent !important;border-right: 4px solid transparent !important;border-top: 4px solid #000 !important;opacity:1 !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li.isOpen > ul.lang-menu {max-height:200px !important;overflow-y:auto !important;z-index:10001 !important; display:block !important;border:2px solid #687a86 !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li.isOpen > ul.lang-menu > li > a {position:relative;padding:4px 15px !important;color: #2a2a2a !important;display:block !important;white-space:no-wrap !important;line-height:18px !important;font-size:13px !important;transition:0.2s all !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li.isOpen > ul.lang-menu > li > a:hover {background-color: #e5e7ea !important;}\n" +
            ".clickout-footer-native_table_box .language-translation ul.lang-ul li.isOpen > ul.lang-menu > li.selected > a {background-color:#455065 !important;color:#fff !important;}\n" +
            ".clickout-footer-native_table_box .footer-divider-between {display:inline-block !important;padding:0 4px !important;color:#ccc !important;}\n" +
            ".clickout-footer-native_table_box .powered-by {color:#212529 !important;font-size:11px !important;text-align:right !important;}\n" +
            ".clickout-footer-native_table_box .powered-by a{color:#212529 !important;font-size: 11px !important;font-weight: bold !important;text-decoration:none !important;transition:.2s !important;padding-left:16px !important;background-color:transparent !important;background-size: contain; background-repeat: no-repeat;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAj9JREFUOE99kk1IVGEUhp9zx5nJ0ai0oASpaTRbtOnH0FwU4p0gcFFWGgXpIrOitm7bBBG0irCRQMWIKOyHFkHjZEHSwgIHCaIZMYpaRKYuFHFm7onrnV+Vzu6833ue75zzfcLKML8cQFydWDQibAcRsL6DvMEyQkQCY/klkk2af/lYXLgLeh7I6atukAGk9Aqvt87bR44xGC3B8oUR6lf51xKUDxSXNPGyYsEBmPE+0PYV3lHQUZAUqrWI0Qhq5DzaT3hXhxCM70f1Y17xbyxpI1I1UgBsiu1FGAL8aV0RqbUBvaheSItJLOsQkZqCRWVBwandaHIc8C5rKr1CMBZHCaRNTwhXn/7vHsyv/SD2ou2IC2YsCbjSxGsMV93JABJDmxoscVV6T/x5lOsi3olqKNNxIQDpIlwV0hDu5Jby66p0C9rtbvl7OwswJ7vA6nFySdmASWAnMAO06aW6HwnlAbDP6Yp2z8npgRwgNgicc3L9ZgPuo2z0ueauzl48egrlJlCcKTAM61jR8ZlXy3kwvgfVT4AnDegXjnwu1cv1noTLbc9prrHAg56W6bH0cz8DKrMekYbljzTVx7qK9eU7nLG4JdCcMaWMlL+4Z+wGKq2gzrKdeEy4urXgz+uLzTWJhE4oxMTQKCpn3PNFpTL4/iewIa84ihqHGQ7MFQAWn5aZhvLQsjjrdbnHlzQZ9bZMb8OMJ7O3qzwn6ergrX/WaXhF2OP4O1i05aWhsjpPaGQC9U0B78C4RzgQyS/5B4rK0GocfWfVAAAAAElFTkSuQmCC);}\n" +
            ".clickout-footer-native_table_box .powered-by a:hover, .clickout-footer-native_table_box a:active{color:#007bff !important;text-decoration:underline !important;}\n"
        ;
        scriptElement.parentNode.insertBefore(containerStyle, scriptElement);

        // add footer after container
        var footerDiv = document.createElement('div');

        footerDiv.innerHTML =
            '<span class="language-translation"><ul class="lang-ul">' +
            /*'<li class="isOpen"><a href="#" onclick="this.parentElement.classList.toggle(\'isOpen\');return false">Change language<span class="caret"></span></a><ul class="lang-menu">' +
            '<li class="selected"><a href="#">English</a></li>' +
            '<li class=""><a href="#">French</a></li>' +
            '<li class=""><a href="#">German</a></li>' +*/
            '</ul></li>' +
            '</ul></span> ' +
            //'<span class="footer-divider-between">|</span> ' +
            '<span class="powered-by">powered by <a href="https://clickout.com?utm_source=native-table-footer" target="_blank" rel="noindex, nofollow">clickout.com</a></span>';
        footerDiv.classList.add("clickout-footer-native_table_box", "clickout-footer-native_table_box-" + containerId);
        scriptElement.parentNode.insertBefore(footerDiv, scriptElement.nextSibling); // append after

        // add container div
        var containerDiv = document.createElement("div");

        containerDiv.innerHTML = html;
        containerDiv.classList.add("clickout-native_table_box-" + containerId);
        scriptElement.parentNode.insertBefore(containerDiv, scriptElement.nextSibling); // append after

        return containerDiv;
    }

    function addResizeClassToContainer(container, containerId) {
        var resizeInt = null;
        var baseClass = 'clickout-rendered-container-' + containerId + '-';
        var resizeClasses = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

        var calculateClassFromWidth = function(width) {
            if (width < 320) {
                return 'xxs';
            } else if (width >=320 && width < 576) {
                return 'xs';
            } else if (width >= 576 && width < 768) {
                return 'sm';
            } else if (width >= 768 && width < 992) {
                return 'md';
            } else if (width >= 992 && width < 1200) {
                return 'lg';
            } else if (width >=1200 && width < 1440) {
                return 'xl';
            } else {
                return 'xxl';
            }
        };

        container.classList.add(baseClass + calculateClassFromWidth(container.clientWidth));

        window.addEventListener("resize", function(){
            clearTimeout(resizeInt);
            resizeInt = setTimeout(function() {
                var resizeCls = calculateClassFromWidth(container.clientWidth);
                resizeClasses.forEach(function (c) {
                    if (container.classList.contains(baseClass + c)) {
                        container.classList.remove(baseClass + c);
                    }
                });
                container.classList.add(baseClass + resizeCls);
                console.log('[sdk]', containerId,'detected resize:',container.clientWidth,'class:',resizeCls);
            }, 250);
        }, true);
    }

    function addTranslationsToContainer(containerId, showTranslate) {
        var uniqueLanguages = [];

        var rows = document.querySelectorAll('.clickout-rendered-container-' + containerId + '-row');

        // iterate over every row which lets us return false to break out of iteration
        rows.forEach(function(el) {
            var rowId = el.getAttribute('data-row_id');
            var translations = el.querySelector('.clickout-rendered-container-'+ containerId+'-translations');

            // don't continue if we don't find translations
            if (!translations) {
                console.warn('[sdk] no translations found for container:', containerId, 'row:', rowId);

                return false;
            }

            var commentNodes = [];
            var iterator = document.createNodeIterator(translations, NodeFilter.SHOW_COMMENT, function() { return NodeFilter.FILTER_ACCEPT; });
            var curNode;
            while (curNode = iterator.nextNode()) {
                commentNodes.push(curNode.nodeValue);
            }

            // remove translations from dom
            translations.remove();

            var lines = commentNodes
                .flatMap(el => el.split(/\r?\n/))
                .map(el => el.trim())
                .filter(el => el && el.includes('='))
                .map(el => [el.slice(0, el.indexOf('=')).toLowerCase(), el.slice(el.indexOf('=') + 1)])
                .filter(el => el.length === 2 && el[0].includes('.'))
                .map(el => el.map(e => e.trim()));

            //console.log('lines:', lines);

            // break if no lines
            if (!lines.length) {
                console.log('[sdk] after parsing no lines found for container:', containerId, 'row:', rowId);

                return false;
            }

            if (translationMap[containerId] === undefined) {
                translationMap[containerId] = {};
            }

            translationMap[containerId][rowId] = {};

            lines.forEach(function(line) {
                var key = line[0].trim();
                var value = line[1].trim();
                //console.log('key:', key, 'value:',  value);
                var [name, lang] = line[0].split('.');
                if (translationMap[containerId][rowId][name] === undefined) {
                    translationMap[containerId][rowId][name] = {};
                }
                translationMap[containerId][rowId][name][lang] = value;

                if (!uniqueLanguages.includes(lang)) {
                    uniqueLanguages.push(lang);
                }
            });

        });

        // we found no languages so bail
        if (!uniqueLanguages.length) {
            console.warn('[sdk] no uniqueNames found for container:', containerId);

            return false;
        }

        // display the translations toolbar
        if (showTranslate) {
            // now add unique languages to dropdown
            var isoLangs={ab:{name:"Abkhaz"},aa:{name:"Afar"},af:{name:"Afrikaans"},ak:{name:"Akan"},sq:{name:"Albanian"},am:{name:"Amharic"},ar:{name:"Arabic"},an:{name:"Aragonese"},hy:{name:"Armenian"},as:{name:"Assamese"},av:{name:"Avaric"},ae:{name:"Avestan"},ay:{name:"Aymara"},az:{name:"Azerbaijani"},bm:{name:"Bambara"},ba:{name:"Bashkir"},eu:{name:"Basque"},be:{name:"Belarusian"},bn:{name:"Bengali"},bh:{name:"Bihari"},bi:{name:"Bislama"},bs:{name:"Bosnian"},br:{name:"Breton"},bg:{name:"Bulgarian"},my:{name:"Burmese"},ca:{name:"Catalan; Valencian"},ch:{name:"Chamorro"},ce:{name:"Chechen"},ny:{name:"Chichewa; Chewa; Nyanja"},zh:{name:"Chinese"},cv:{name:"Chuvash"},kw:{name:"Cornish"},co:{name:"Corsican"},cr:{name:"Cree"},hr:{name:"Croatian"},cs:{name:"Czech"},da:{name:"Danish"},dv:{name:"Divehi; Dhivehi; Maldivian;"},nl:{name:"Dutch"},en:{name:"English"},eo:{name:"Esperanto"},et:{name:"Estonian"},ee:{name:"Ewe"},fo:{name:"Faroese"},fj:{name:"Fijian"},fi:{name:"Finnish"},fr:{name:"French"},ff:{name:"Fula; Fulah; Pulaar; Pular"},gl:{name:"Galician"},ka:{name:"Georgian"},de:{name:"German"},el:{name:"Greek, Modern"},gn:{name:"Guaran\xed"},gu:{name:"Gujarati"},ht:{name:"Haitian; Haitian Creole"},ha:{name:"Hausa"},he:{name:"Hebrew (modern)"},hz:{name:"Herero"},hi:{name:"Hindi"},ho:{name:"Hiri Motu"},hu:{name:"Hungarian"},ia:{name:"Interlingua"},id:{name:"Indonesian"},ie:{name:"Interlingue"},ga:{name:"Irish"},ig:{name:"Igbo"},ik:{name:"Inupiaq"},io:{name:"Ido"},is:{name:"Icelandic"},it:{name:"Italian"},iu:{name:"Inuktitut"},ja:{name:"Japanese"},jv:{name:"Javanese"},kl:{name:"Kalaallisut, Greenlandic"},kn:{name:"Kannada"},kr:{name:"Kanuri"},ks:{name:"Kashmiri"},kk:{name:"Kazakh"},km:{name:"Khmer"},ki:{name:"Kikuyu, Gikuyu"},rw:{name:"Kinyarwanda"},ky:{name:"Kirghiz, Kyrgyz"},kv:{name:"Komi"},kg:{name:"Kongo"},ko:{name:"Korean"},ku:{name:"Kurdish"},kj:{name:"Kwanyama, Kuanyama"},la:{name:"Latin"},lb:{name:"Luxembourgish, Letzeburgesch"},lg:{name:"Luganda"},li:{name:"Limburgish, Limburgan, Limburger"},ln:{name:"Lingala"},lo:{name:"Lao"},lt:{name:"Lithuanian"},lu:{name:"Luba-Katanga",nativeName:""},lv:{name:"Latvian"},gv:{name:"Manx"},mk:{name:"Macedonian"},mg:{name:"Malagasy"},ms:{name:"Malay"},ml:{name:"Malayalam"},mt:{name:"Maltese"},mi:{name:"M\u0101ori"},mr:{name:"Marathi (Mar\u0101\u1E6Dh\u012B)"},mh:{name:"Marshallese"},mn:{name:"Mongolian"},na:{name:"Nauru"},nv:{name:"Navajo, Navaho"},nb:{name:"Norwegian"},nd:{name:"North Ndebele"},ne:{name:"Nepali"},ng:{name:"Ndonga"},nn:{name:"Norwegian Nynorsk"},no:{name:"Norwegian"},ii:{name:"Nuosu"},nr:{name:"South Ndebele"},oc:{name:"Occitan"},oj:{name:"Ojibwe, Ojibwa"},cu:{name:"Old Church Slavonic, Church Slavic, Church Slavonic, Old Bulgarian, Old Slavonic"},om:{name:"Oromo"},or:{name:"Oriya"},os:{name:"Ossetian, Ossetic"},pa:{name:"Panjabi, Punjabi"},pi:{name:"P\u0101li"},fa:{name:"Persian"},pl:{name:"Polish"},ps:{name:"Pashto, Pushto"},pt:{name:"Portuguese"},qu:{name:"Quechua"},rm:{name:"Romansh"},rn:{name:"Kirundi"},ro:{name:"Romanian, Moldavian, Moldovan"},ru:{name:"Russian"},sa:{name:"Sanskrit (Sa\u1E41sk\u1E5Bta)"},sc:{name:"Sardinian"},sd:{name:"Sindhi"},se:{name:"Northern Sami"},sm:{name:"Samoan"},sg:{name:"Sango"},sr:{name:"Serbian"},gd:{name:"Scottish Gaelic; Gaelic"},sn:{name:"Shona"},si:{name:"Sinhala, Sinhalese"},sk:{name:"Slovak"},sl:{name:"Slovene"},so:{name:"Somali"},st:{name:"Southern Sotho"},es:{name:"Spanish"},su:{name:"Sundanese"},sw:{name:"Swahili"},ss:{name:"Swati"},sv:{name:"Swedish"},ta:{name:"Tamil"},te:{name:"Telugu"},tg:{name:"Tajik"},th:{name:"Thai"},ti:{name:"Tigrinya"},bo:{name:"Tibetan Standard, Tibetan, Central"},tk:{name:"Turkmen"},tl:{name:"Tagalog"},tn:{name:"Tswana"},to:{name:"Tonga (Tonga Islands)"},tr:{name:"Turkish"},ts:{name:"Tsonga"},tt:{name:"Tatar"},tw:{name:"Twi"},ty:{name:"Tahitian"},ug:{name:"Uighur, Uyghur"},uk:{name:"Ukrainian"},ur:{name:"Urdu"},uz:{name:"Uzbek"},ve:{name:"Venda"},vi:{name:"Vietnamese"},vo:{name:"Volap\xfck"},wa:{name:"Walloon"},cy:{name:"Welsh"},wo:{name:"Wolof"},fy:{name:"Western Frisian"},xh:{name:"Xhosa"},yi:{name:"Yiddish"},yo:{name:"Yoruba"},za:{name:"Zhuang, Chuang"}};
            var langUl = document.querySelector('.clickout-footer-native_table_box-' + containerId+ ' ul.lang-ul');
            var str = '<li><a href="#">Change language<span class="caret"></span></a><ul class="lang-menu">';
            uniqueLanguages.forEach(function(lang) {
                if (isoLangs[lang] !== undefined) {
                    str += '<li' + (lang === currentLang ? ' class="selected"' : '') + '><a data-changelang="' + lang + '" href="#">' + isoLangs[lang].name + '</a></li>';
                }
            });

            str += '</ul>';
            langUl.innerHTML = str;

            // insert separator
            var separator = document.createElement('span');
            separator.classList.add('footer-divider-between');
            separator.textContent = '|';
            var poweredBy = document.querySelector('.clickout-footer-native_table_box-' + containerId+ ' .powered-by');
            poweredBy.parentNode.insertBefore(separator, poweredBy.previousSibling); // append after

            var dropdown = document.querySelector('.clickout-footer-native_table_box-' + containerId+ ' ul.lang-ul > li');
            // attach events
            var keepDropdownVisible = false;
            var keepDropdownVisibleInt;
            dropdown.addEventListener('mouseenter', function(e) {
                clearTimeout(keepDropdownVisibleInt);
                e.target.classList.add('isOpen');
                keepDropdownVisible = true;
                keepDropdownVisibleInt = setTimeout(function() { keepDropdownVisible = false}, 500);
            }, false);

            dropdown.addEventListener('mouseleave', function(e) {
                if (!keepDropdownVisible) {
                    e.target.classList.remove('isOpen');
                }
            }, false);

            dropdown.addEventListener('click', function(e) {
                e.target.classList.toggle('isOpen');
                e.preventDefault();

                return false;
            });

            dropdown.addEventListener('touchend', function(e) {
                var target;
                if (e.target.getAttribute('href')) {
                    target = e.target.parentElement;
                } else {
                    target = e.target;
                }
                clearTimeout(keepDropdownVisibleInt);
                if (!target.classList.contains('isOpen')) {
                    target.classList.add('isOpen');
                    keepDropdownVisible = true;
                    keepDropdownVisibleInt = setTimeout(function () {
                        keepDropdownVisible = false
                    }, 500);
                } else {
                    target.classList.remove('isOpen');
                }
                //e.target.classList.toggle('isOpen');
                e.preventDefault();
            });

            // attach events to menu items
            var menuHolderItems = document.querySelectorAll('.clickout-footer-native_table_box-' + containerId+ ' ul.lang-ul > li > ul.lang-menu > li');
            var menuItems = document.querySelectorAll('.clickout-footer-native_table_box-' + containerId+ ' ul.lang-ul > li > ul.lang-menu > li');
            var removeSelectedFromMenuHolderItems = function() {
                menuHolderItems.forEach(el => el.classList.remove('selected'));
            };
            var handleClick = function(e) {
                var lang = e.target.getAttribute('data-changelang');
                removeSelectedFromMenuHolderItems();
                e.target.parentElement.classList.add('selected');
                dropdown.classList.remove('isOpen');

                translate(lang, containerId);

                e.preventDefault();
            };
            menuItems.forEach(function(el) {
                el.addEventListener('click', e => handleClick(e));
                el.addEventListener('touchend',e => handleClick(e));
            });
        }

        //console.log(uniqueLanguages);
        //console.log(translationMap);

        return translationMap;
    }

    function translate(lang, containerId) {
        console.log('[sdk] translate:', containerId, 'to:', lang);

        var rows = document.querySelectorAll('.clickout-rendered-container-' + containerId + '-row');

        rows.forEach(function(el) {
            var rowId = el.getAttribute('data-row_id');
            var translations = el.querySelectorAll('.clickout-native_table_box-'+containerId+' [data-translate]');

            translations.forEach(function(t) {
                var name = t.getAttribute('data-translate');
                if (!name) {
                    return false;
                }
                name = name.toLowerCase();
                if (translationMap[containerId] !== undefined &&
                    translationMap[containerId][rowId] !== undefined &&
                    translationMap[containerId][rowId][name] !== undefined &&
                    translationMap[containerId][rowId][name][lang] !== undefined) {
                    t.innerHTML = translationMap[containerId][rowId][name][lang];
                }
            });
        })
    }

    function extractConfig(containerId) {
        let config = document.querySelector('.clickout-native_table_box-'+containerId+' .clickout-config');
        if (!config) {
            console.warn('[sdk] config not found');

            return null;
        }

        if (config.hasAttribute('data-lang')) {
            currentLang = config.getAttribute('data-lang');
            console.log('[sdk] config set lang to', currentLang);
        }
    }

    function positionRowsAccordingToType(containerId) {
        let rows = document.querySelectorAll('.clickout-rendered-container-' + containerId + '-row');

        // iterate over every row which lets us return false to break out of iteration
        rows.forEach(function(row) {
            var rowId = row.getAttribute('data-row_id');
            var config = row.querySelector('.clickout-rendered-container-'+ containerId+'-config');

            if (config && config.hasAttribute('data-type') && 'banner' === config.getAttribute('data-type')) {
                let position = config.hasAttribute('data-position') ? config.getAttribute('data-position') : 'top';
                if (position === 'footer') {
                    position = 'bottom';
                }

                console.log('[sdk] found', position, 'banner');

                // delete footer element if only 1 row
                if (rows.length === 1) {
                    let footer = document.querySelector('.clickout-footer-native_table_box-' + containerId);
                    if (footer) {
                        console.log('[sdk] removing footer from', containerId);
                        footer.remove();
                    }
                }

                // hook up close button
                var close = row.querySelector('[data-container-action="close"]');
                if (close) {
                    close.addEventListener('click', function(e) {
                        console.log('[sdk] close clicked for container', containerId, 'id', id);
                        row.remove();
                        hideContainer(id);
                    });
                }

                // move element to end of body
                row.classList.add('clickout-banner-native_table_box', 'clickout-banner-native_table_box-'+position);
                document.body.insertAdjacentElement('afterbegin', row);

                let hideOrShowBasedOnScroll = function() {
                    let scrollAmount = window.scrollY;
                    if (scrollAmount > 75) {
                        row.style.display = 'block';
                    } else {
                        row.style.display = 'none';
                    }
                }

                hideOrShowBasedOnScroll();

                let scrollInt;
                document.addEventListener("scroll", function(){
                    clearTimeout(scrollInt);
                    scrollInt = setTimeout(hideOrShowBasedOnScroll, 1);
                }, true);
            }


        });
    }

    function getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    function setCookie(name, value, props) {
        props = props || {};

        // props.expires = int (minutes)
        if (typeof props.expires == "number" && props.expires) {
            var d = new Date();
            d.setTime(d.getTime() + props.expires * 60 * 1000);
            props.expires = d;
        }

        if(props.expires && props.expires.toUTCString) {
            props.expires = props.expires.toUTCString();
        }

        value = encodeURIComponent(value);
        var updatedCookie = name + "=" + value;
        for(var propName in props){
            var propValue = props[propName];

            updatedCookie += "; " + propName;
            if(propValue !== true){
                updatedCookie += "=" + propValue;
            }
        }

        document.cookie = updatedCookie;
    }

    function deleteCookie(name) {
        setCookie(name, null, {expires: -1});
    }

    function hideContainer(id) {
        var d = new Date();
        d.setTime(d.getTime() + 10 * 60 * 1000);
        setCookie(id, d.toString(), {path: '/', 'max-age': 10*60});
        console.log('[sdk] hidden', id, 'until', d.toString());
    }

    function canShowContainer(id) {
        return !getCookie(id);
    }

    var dataFromScriptElement = getDataFromScriptElement();
    if (!dataFromScriptElement) {
        console.error('[sdk] exit');

        return null;
    }

    var outerHtml = dataFromScriptElement.outerHtml;
    var scriptElement = dataFromScriptElement.scriptElement;
    var containerId = dataFromScriptElement.containerId;
    var url = getUrlFromOuterHtml(outerHtml);
    var id = dataFromScriptElement.id;
    var queryString = dataFromScriptElement.queryString;
    var showTranslate = dataFromScriptElement.showTranslate;
    var getUrl = createGetUrlForApiCall(url, id, queryString);
    var referrer = getReferrer();

    if (!canShowContainer(id)) {
        var startDate = new Date();
        var endDate = new Date(getCookie(id));
        if (endDate && endDate instanceof Date && !isNaN(endDate)) {
            var delta = Math.abs(endDate - startDate) / 1000;
            var isNegative = startDate > endDate ? -1 : 1;
            var remaining = [
                ['days', 24 * 60 * 60],
                ['hours', 60 * 60],
                ['minutes', 60],
                ['seconds', 1]
            ].reduce((acc, [key, value]) => (acc[key] = Math.floor(delta / value) * isNegative, delta -= acc[key] * isNegative * value, acc), {});

            console.log('[sdk]', id, 'is hidden for', remaining.minutes, 'mins', remaining.seconds, 'secs');

            return null;
        } else {
            console.log('[sdk] cookie corrupted, deleting for', id);
            deleteCookie(id);
        }
    }


    callApi(getUrl, referrer)
        .then(function (result) {
            let container = injectHtmlIntoParent(result.res, containerId);
            extractConfig(containerId);
            addResizeClassToContainer(container, containerId);
            translationMap = addTranslationsToContainer(containerId, showTranslate);
            translate(currentLang, containerId);
            positionRowsAccordingToType(containerId);
        }).catch(function(e) {
            console.log(e);
        });
})();

