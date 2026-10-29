import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/admin/visa-applications',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::index
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:21
 * @route '/api/admin/visa-applications'
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
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/admin/visa-applications/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
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
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::show
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:49
 * @route '/api/admin/visa-applications/{id}'
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
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::update
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:56
 * @route '/api/admin/visa-applications/{id}'
 */
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/admin/visa-applications/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::update
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:56
 * @route '/api/admin/visa-applications/{id}'
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
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::update
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:56
 * @route '/api/admin/visa-applications/{id}'
 */
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::update
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:56
 * @route '/api/admin/visa-applications/{id}'
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
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::update
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:56
 * @route '/api/admin/visa-applications/{id}'
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
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
export const passport = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: passport.url(args, options),
    method: 'get',
})

passport.definition = {
    methods: ["get","head"],
    url: '/api/admin/visa-applications/{id}/passport',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
passport.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return passport.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
passport.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: passport.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
passport.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: passport.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
    const passportForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: passport.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
        passportForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: passport.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\AdminVisaApplicationController::passport
 * @see app/Http/Controllers/Api/AdminVisaApplicationController.php:67
 * @route '/api/admin/visa-applications/{id}/passport'
 */
        passportForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: passport.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    passport.form = passportForm
const AdminVisaApplicationController = { index, show, update, passport }

export default AdminVisaApplicationController