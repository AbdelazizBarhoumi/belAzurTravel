import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
const ViewController980bb49ee7ae63891f1d891d2fbcf1c9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})

ViewController980bb49ee7ae63891f1d891d2fbcf1c9.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url = (options?: RouteQueryOptions) => {
    return ViewController980bb49ee7ae63891f1d891d2fbcf1c9.definition.url + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
ViewController980bb49ee7ae63891f1d891d2fbcf1c9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
ViewController980bb49ee7ae63891f1d891d2fbcf1c9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
    const ViewController980bb49ee7ae63891f1d891d2fbcf1c9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
        ViewController980bb49ee7ae63891f1d891d2fbcf1c9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url(options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/'
 */
        ViewController980bb49ee7ae63891f1d891d2fbcf1c9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController980bb49ee7ae63891f1d891d2fbcf1c9.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewController980bb49ee7ae63891f1d891d2fbcf1c9.form = ViewController980bb49ee7ae63891f1d891d2fbcf1c9Form
    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
const ViewController42a740574ecbfbac32f8cc353fc32db9 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'get',
})

ViewController42a740574ecbfbac32f8cc353fc32db9.definition = {
    methods: ["get","head"],
    url: '/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
ViewController42a740574ecbfbac32f8cc353fc32db9.url = (options?: RouteQueryOptions) => {
    return ViewController42a740574ecbfbac32f8cc353fc32db9.definition.url + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
ViewController42a740574ecbfbac32f8cc353fc32db9.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
ViewController42a740574ecbfbac32f8cc353fc32db9.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewController42a740574ecbfbac32f8cc353fc32db9.url(options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
    const ViewController42a740574ecbfbac32f8cc353fc32db9Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewController42a740574ecbfbac32f8cc353fc32db9.url(options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
        ViewController42a740574ecbfbac32f8cc353fc32db9Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController42a740574ecbfbac32f8cc353fc32db9.url(options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/dashboard'
 */
        ViewController42a740574ecbfbac32f8cc353fc32db9Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController42a740574ecbfbac32f8cc353fc32db9.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewController42a740574ecbfbac32f8cc353fc32db9.form = ViewController42a740574ecbfbac32f8cc353fc32db9Form
    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
const ViewControllere0af14568d644134923b43839c4dbf44 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewControllere0af14568d644134923b43839c4dbf44.url(options),
    method: 'get',
})

ViewControllere0af14568d644134923b43839c4dbf44.definition = {
    methods: ["get","head"],
    url: '/client',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
ViewControllere0af14568d644134923b43839c4dbf44.url = (options?: RouteQueryOptions) => {
    return ViewControllere0af14568d644134923b43839c4dbf44.definition.url + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
ViewControllere0af14568d644134923b43839c4dbf44.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewControllere0af14568d644134923b43839c4dbf44.url(options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
ViewControllere0af14568d644134923b43839c4dbf44.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewControllere0af14568d644134923b43839c4dbf44.url(options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
    const ViewControllere0af14568d644134923b43839c4dbf44Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewControllere0af14568d644134923b43839c4dbf44.url(options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
        ViewControllere0af14568d644134923b43839c4dbf44Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewControllere0af14568d644134923b43839c4dbf44.url(options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client'
 */
        ViewControllere0af14568d644134923b43839c4dbf44Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewControllere0af14568d644134923b43839c4dbf44.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewControllere0af14568d644134923b43839c4dbf44.form = ViewControllere0af14568d644134923b43839c4dbf44Form
    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
const ViewController4076cdf7f7e8f0c25e54b566d2c85d5c = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url(args, options),
    method: 'get',
})

ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.definition = {
    methods: ["get","head"],
    url: '/client/{any}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { any: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    any: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        any: args.any,
                }

    return ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.definition.url
            .replace('{any}', parsedArgs.any.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.get = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url(args, options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.head = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url(args, options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
    const ViewController4076cdf7f7e8f0c25e54b566d2c85d5cForm = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url(args, options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
        ViewController4076cdf7f7e8f0c25e54b566d2c85d5cForm.get = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url(args, options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/client/{any}'
 */
        ViewController4076cdf7f7e8f0c25e54b566d2c85d5cForm.head = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewController4076cdf7f7e8f0c25e54b566d2c85d5c.form = ViewController4076cdf7f7e8f0c25e54b566d2c85d5cForm
    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
const ViewController35f58437d9250c39f332f5e8e70440b7 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController35f58437d9250c39f332f5e8e70440b7.url(options),
    method: 'get',
})

ViewController35f58437d9250c39f332f5e8e70440b7.definition = {
    methods: ["get","head"],
    url: '/admin',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
ViewController35f58437d9250c39f332f5e8e70440b7.url = (options?: RouteQueryOptions) => {
    return ViewController35f58437d9250c39f332f5e8e70440b7.definition.url + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
ViewController35f58437d9250c39f332f5e8e70440b7.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController35f58437d9250c39f332f5e8e70440b7.url(options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
ViewController35f58437d9250c39f332f5e8e70440b7.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewController35f58437d9250c39f332f5e8e70440b7.url(options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
    const ViewController35f58437d9250c39f332f5e8e70440b7Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewController35f58437d9250c39f332f5e8e70440b7.url(options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
        ViewController35f58437d9250c39f332f5e8e70440b7Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController35f58437d9250c39f332f5e8e70440b7.url(options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin'
 */
        ViewController35f58437d9250c39f332f5e8e70440b7Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController35f58437d9250c39f332f5e8e70440b7.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewController35f58437d9250c39f332f5e8e70440b7.form = ViewController35f58437d9250c39f332f5e8e70440b7Form
    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
const ViewController419215b33deae794b6cb686dfcc17af7 = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController419215b33deae794b6cb686dfcc17af7.url(args, options),
    method: 'get',
})

ViewController419215b33deae794b6cb686dfcc17af7.definition = {
    methods: ["get","head"],
    url: '/admin/{any}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
ViewController419215b33deae794b6cb686dfcc17af7.url = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { any: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    any: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        any: args.any,
                }

    return ViewController419215b33deae794b6cb686dfcc17af7.definition.url
            .replace('{any}', parsedArgs.any.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
ViewController419215b33deae794b6cb686dfcc17af7.get = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewController419215b33deae794b6cb686dfcc17af7.url(args, options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
ViewController419215b33deae794b6cb686dfcc17af7.head = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewController419215b33deae794b6cb686dfcc17af7.url(args, options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
    const ViewController419215b33deae794b6cb686dfcc17af7Form = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewController419215b33deae794b6cb686dfcc17af7.url(args, options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
        ViewController419215b33deae794b6cb686dfcc17af7Form.get = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController419215b33deae794b6cb686dfcc17af7.url(args, options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/admin/{any}'
 */
        ViewController419215b33deae794b6cb686dfcc17af7Form.head = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewController419215b33deae794b6cb686dfcc17af7.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewController419215b33deae794b6cb686dfcc17af7.form = ViewController419215b33deae794b6cb686dfcc17af7Form
    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
const ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url(args, options),
    method: 'get',
})

ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.definition = {
    methods: ["get","head"],
    url: '/{any}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { any: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    any: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        any: args.any,
                }

    return ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.definition.url
            .replace('{any}', parsedArgs.any.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.get = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url(args, options),
    method: 'get',
})
/**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.head = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url(args, options),
    method: 'head',
})

    /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
    const ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46fForm = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url(args, options),
        method: 'get',
    })

            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
        ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46fForm.get = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url(args, options),
            method: 'get',
        })
            /**
* @see \Illuminate\Routing\ViewController::__invoke
 * @see vendor/laravel/framework/src/Illuminate/Routing/ViewController.php:32
 * @route '/{any}'
 */
        ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46fForm.head = (args: { any: string | number } | [any: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f.form = ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46fForm

const ViewController = {
    '/': ViewController980bb49ee7ae63891f1d891d2fbcf1c9,
    '/dashboard': ViewController42a740574ecbfbac32f8cc353fc32db9,
    '/client': ViewControllere0af14568d644134923b43839c4dbf44,
    '/client/{any}': ViewController4076cdf7f7e8f0c25e54b566d2c85d5c,
    '/admin': ViewController35f58437d9250c39f332f5e8e70440b7,
    '/admin/{any}': ViewController419215b33deae794b6cb686dfcc17af7,
    '/{any}': ViewControllerdaf00c867fc8d5f5e5c3271eae2aa46f,
}

export default ViewController