console.log('Hello World!')
const testFolder = './';
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
fs.readdirSync(testFolder).forEach(file => {
  console.log(file);
});
fs.readFile('index.html', function(err, data) {
    //console.log(data.toString());
    const dom = new JSDOM(data.toString(), { runScripts: "dangerously" });
    const elements = dom.window.document.getElementsByClassName('ads-wrapper');
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
    var elements1 = dom.window.document.getElementsByClassName('dcmads');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementsByClassName('GoogleActiveViewElement');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementsByClassName('placement_473972_0_ins');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementsByClassName('etoro-popup-banner');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementById('custom_html-8');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementById('custom_html-7');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementById('custom_html-10');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementById('custom_html-12');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    var html = dom.serialize().toString();
    html.replace('<link rel="preconnect" href="https://www.googletagmanager.com/">','');
    html.replace('<link rel="dns-prefetch" href="https://www.googletagmanager.com/">','');
    html.replace('<meta name="google-site-verification" content="kdpyRUb5Uhr1fvI1fl-CXuQKDBJxot4dDUOStO8L-dg">','');
    html.replace('<script type="b4b7348f9d29b36ffc217dcf-text/javascript">var jnews_module_426885_2_61969b7330447 = {"header_icon":"","first_title":"","second_title":"","url":"","header_type":"heading_6","header_background":"","header_secondary_background":"","header_text_color":"","header_line_color":"","header_accent_color":"","header_filter_category":"","header_filter_author":"","header_filter_tag":"","header_filter_text":"All","post_type":"post","content_type":"all","number_post":"5","post_offset":"1","unique_content":"disable","include_post":"","exclude_post":"","include_category":"","exclude_category":"79568,17","include_author":"","include_tag":"","exclude_tag":"","category":"","post_tag":"","ld_course_category":"","ld_course_tag":"","ld_lesson_category":"","ld_lesson_tag":"","ld_topic_category":"","ld_topic_tag":"","sort_by":"latest","date_format":"ago","date_format_custom":"Y\/m\/d","excerpt_length":"30","excerpt_ellipsis":"...","force_normal_image_load":"","pagination_mode":"loadmore","pagination_nextprev_showtext":"","pagination_number_post":"5","pagination_scroll_limit":0,"ads_type":"code","ads_position":"1","ads_random":"","ads_image":"","ads_image_tablet":"","ads_image_phone":"","ads_image_link":"","ads_image_alt":"","ads_image_new_tab":"","google_publisher_id":"","google_slot_id":"","google_desktop":"auto","google_tab":"auto","google_phone":"auto","content":"","ads_bottom_text":"","boxed":"","boxed_shadow":"","el_id":"","el_class":"etoro-ad-posts","scheme":"","column_width":"auto","title_color":"","accent_color":"","alt_color":"","excerpt_color":"","css":"","compatible_column_notice":"","paged":1,"column_class":"jeg_col_2o3","class":"jnews_block_3"};</script>','');
    var reg = new RegExp('('+'newsbtc'+')', 'gi');
    html.replace('newsbtc.com','btcland.xyz');
    html.replace(/newsbtc/ig, 'btcland');
    //console.log(dom.serialize());
    fs.writeFile('index.html', html, function (err) {
        if (err) throw err;
        console.log('Saved!');
      }); 
  });