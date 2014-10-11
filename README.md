larvitTmpl
==========

DOM Template engine for javascript

Tests are written for the module "nodeunit"

Example of usage:

    var larvitTmpl = require('larvittmpl');

    // Defaults to '<!DOCTYPE html>'
    larvitTmpl.doctype = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';

    // Where to look for partials, snippets of HTML or XML that
    // can be included with for example: <partial data-template="inc.menu.html" />
    // Defaults to './public/html'
    larvitTmpl.root = './templates';

    // Example template string.
    var tmplStr = '<html data-attribute="htmlLang">' +
                    '<head>' +
                      '<title data-value="title" />' +
                    '</head>' +
                    '<body>' +
                      '<h1 data-value="title" />' +
                      '<p data-value="paragraphs" />' +
                      '<ul>' +
                        '<li data-value="listitems">' +
                          '<a data-localvalue="linkName" data-localattribute="url extraClass" class="link" />' +
                        '</li>' +
                      '</ul>' +
                    '</body>' +
                  '</html>';

    // Example template data
    var tmplData = {
      'htmlLang': {'name': 'lang', 'value': 'sv'},
      'title': 'foo',
      'paragraphs': [
        'Lorem Ipsum is simply dummy text of the printing.',
        'It has survived not only five centuries.',
        'It was popularised in the 1960s.'
      ],
      'listitems': [
        {
          'linkName': 'Larv IT AB',
          'url': {'name': 'href', 'value': 'http://larvit.se'}
        },
        {
          'linkName': 'Vinnovera AB',
          'url': {'name': 'href', 'value': 'http://vinnovera.se'},
          'extraClass': {'name': 'class', 'value': 'selected'}
        },
        {
          'linkName': 'Hacker News',
          'url': {'name': 'href', 'value': 'https://news.ycombinator.com/'}
        },
      ]
    };

    larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
      /* resultStr is now (without newlines and indents):
      <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
      <html data-attribute="htmlLang" lang="sv">
        <head>
          <title data-value="title">foo</title>
        </head>
        <body>
          <h1 data-value="title">foo</h1>
          <p data-value="paragraphs">Lorem Ipsum is simply dummy text of the printing.</p>
          <p data-value="paragraphs">It has survived not only five centuries.</p>
          <p data-value="paragraphs">It was popularised in the 1960s.</p>
          <ul>
            <li data-value="listitems">
              <a data-localvalue="linkName" data-localattribute="url extraClass" class="link" href="http://larvit.se">Larv IT AB</a>
            </li>
            <li data-value="listitems">
              <a data-localvalue="linkName" data-localattribute="url extraClass" class="link selected" href="http://vinnovera.se">Vinnovera AB</a>
            </li>
            <li data-value="listitems">
              <a data-localvalue="linkName" data-localattribute="url extraClass" class="link" href="https://news.ycombinator.com/">Hacker News</a>
            </li>
          </ul>
        </body>
      </html>
      */
    });

For more examples, see the test folder