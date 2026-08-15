import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/api/admin/os-travel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::dashboard
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:33
 * @route '/api/admin/os-travel'
 */
        dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboard.form = dashboardForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/admin/os-travel/hotels',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::index
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:65
 * @route '/api/admin/os-travel/hotels'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
export const references = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: references.url(options),
    method: 'get',
})

references.definition = {
    methods: ["get","head"],
    url: '/api/admin/os-travel/references',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
references.url = (options?: RouteQueryOptions) => {
    return references.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
references.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: references.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
references.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: references.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
    const referencesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: references.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
        referencesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: references.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::references
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:133
 * @route '/api/admin/os-travel/references'
 */
        referencesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: references.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    references.form = referencesForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approveAll
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:282
 * @route '/api/admin/os-travel/hotels/approve-all'
 */
export const approveAll = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approveAll.url(options),
    method: 'post',
})

approveAll.definition = {
    methods: ["post"],
    url: '/api/admin/os-travel/hotels/approve-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approveAll
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:282
 * @route '/api/admin/os-travel/hotels/approve-all'
 */
approveAll.url = (options?: RouteQueryOptions) => {
    return approveAll.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approveAll
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:282
 * @route '/api/admin/os-travel/hotels/approve-all'
 */
approveAll.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approveAll.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approveAll
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:282
 * @route '/api/admin/os-travel/hotels/approve-all'
 */
    const approveAllForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: approveAll.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approveAll
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:282
 * @route '/api/admin/os-travel/hotels/approve-all'
 */
        approveAllForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: approveAll.url(options),
            method: 'post',
        })
    
    approveAll.form = approveAllForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrices
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:387
 * @route '/api/admin/os-travel/hotels/refresh-prices'
 */
export const refreshPrices = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshPrices.url(options),
    method: 'post',
})

refreshPrices.definition = {
    methods: ["post"],
    url: '/api/admin/os-travel/hotels/refresh-prices',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrices
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:387
 * @route '/api/admin/os-travel/hotels/refresh-prices'
 */
refreshPrices.url = (options?: RouteQueryOptions) => {
    return refreshPrices.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrices
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:387
 * @route '/api/admin/os-travel/hotels/refresh-prices'
 */
refreshPrices.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshPrices.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrices
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:387
 * @route '/api/admin/os-travel/hotels/refresh-prices'
 */
    const refreshPricesForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: refreshPrices.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrices
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:387
 * @route '/api/admin/os-travel/hotels/refresh-prices'
 */
        refreshPricesForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: refreshPrices.url(options),
            method: 'post',
        })
    
    refreshPrices.form = refreshPricesForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/admin/os-travel/hotels/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::show
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:161
 * @route '/api/admin/os-travel/hotels/{id}'
 */
        showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::update
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:181
 * @route '/api/admin/os-travel/hotels/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/admin/os-travel/hotels/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::update
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:181
 * @route '/api/admin/os-travel/hotels/{id}'
 */
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::update
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:181
 * @route '/api/admin/os-travel/hotels/{id}'
 */
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::update
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:181
 * @route '/api/admin/os-travel/hotels/{id}'
 */
    const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::update
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:181
 * @route '/api/admin/os-travel/hotels/{id}'
 */
        updateForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approve
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:210
 * @route '/api/admin/os-travel/hotels/{id}/approve'
 */
export const approve = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/api/admin/os-travel/hotels/{id}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approve
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:210
 * @route '/api/admin/os-travel/hotels/{id}/approve'
 */
approve.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return approve.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approve
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:210
 * @route '/api/admin/os-travel/hotels/{id}/approve'
 */
approve.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approve
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:210
 * @route '/api/admin/os-travel/hotels/{id}/approve'
 */
    const approveForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: approve.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::approve
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:210
 * @route '/api/admin/os-travel/hotels/{id}/approve'
 */
        approveForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: approve.url(args, options),
            method: 'post',
        })
    
    approve.form = approveForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::reject
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:429
 * @route '/api/admin/os-travel/hotels/{id}/reject'
 */
export const reject = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/api/admin/os-travel/hotels/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::reject
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:429
 * @route '/api/admin/os-travel/hotels/{id}/reject'
 */
reject.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return reject.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::reject
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:429
 * @route '/api/admin/os-travel/hotels/{id}/reject'
 */
reject.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::reject
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:429
 * @route '/api/admin/os-travel/hotels/{id}/reject'
 */
    const rejectForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reject.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::reject
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:429
 * @route '/api/admin/os-travel/hotels/{id}/reject'
 */
        rejectForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reject.url(args, options),
            method: 'post',
        })
    
    reject.form = rejectForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::unapprove
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:454
 * @route '/api/admin/os-travel/hotels/{id}/unapprove'
 */
export const unapprove = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: unapprove.url(args, options),
    method: 'post',
})

unapprove.definition = {
    methods: ["post"],
    url: '/api/admin/os-travel/hotels/{id}/unapprove',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::unapprove
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:454
 * @route '/api/admin/os-travel/hotels/{id}/unapprove'
 */
unapprove.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return unapprove.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::unapprove
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:454
 * @route '/api/admin/os-travel/hotels/{id}/unapprove'
 */
unapprove.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: unapprove.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::unapprove
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:454
 * @route '/api/admin/os-travel/hotels/{id}/unapprove'
 */
    const unapproveForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: unapprove.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::unapprove
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:454
 * @route '/api/admin/os-travel/hotels/{id}/unapprove'
 */
        unapproveForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: unapprove.url(args, options),
            method: 'post',
        })
    
    unapprove.form = unapproveForm
/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrice
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:413
 * @route '/api/admin/os-travel/hotels/{id}/refresh-price'
 */
export const refreshPrice = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshPrice.url(args, options),
    method: 'post',
})

refreshPrice.definition = {
    methods: ["post"],
    url: '/api/admin/os-travel/hotels/{id}/refresh-price',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrice
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:413
 * @route '/api/admin/os-travel/hotels/{id}/refresh-price'
 */
refreshPrice.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return refreshPrice.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrice
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:413
 * @route '/api/admin/os-travel/hotels/{id}/refresh-price'
 */
refreshPrice.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshPrice.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrice
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:413
 * @route '/api/admin/os-travel/hotels/{id}/refresh-price'
 */
    const refreshPriceForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: refreshPrice.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\AdminOsTravelController::refreshPrice
 * @see app/Http/Controllers/Api/AdminOsTravelController.php:413
 * @route '/api/admin/os-travel/hotels/{id}/refresh-price'
 */
        refreshPriceForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: refreshPrice.url(args, options),
            method: 'post',
        })
    
    refreshPrice.form = refreshPriceForm
const AdminOsTravelController = { dashboard, index, references, approveAll, refreshPrices, show, update, approve, reject, unapprove, refreshPrice }

export default AdminOsTravelController