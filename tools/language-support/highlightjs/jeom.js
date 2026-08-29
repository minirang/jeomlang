hljs.registerLanguage('jeom', function (hljs) {
    return {
        name: 'JeomLang',
        aliases: ['jeomlang'],
        contains: [
            {
                className: 'comment',
                begin: '◘',
                end: '$'
            },
            {
                className: 'string',
                begin: '●',
                end: '●'
            },
            {
                className: 'number',
                begin: '•',
                end: '•'
            },
            {
                className: 'keyword',
                begin: '(⋮⋮|⋮|…|‥|˙|∘)'
            }
        ]
    };
});
