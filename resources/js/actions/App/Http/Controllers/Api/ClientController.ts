import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/api/client/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ClientController::dashboard
 * @see app/Http/Controllers/Api/ClientController.php:20
 * @route '/api/client/dashboard'
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
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
export const bookings = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bookings.url(options),
    method: 'get',
})

bookings.definition = {
    methods: ["get","head"],
    url: '/api/client/bookings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
bookings.url = (options?: RouteQueryOptions) => {
    return bookings.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
bookings.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bookings.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
bookings.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bookings.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
    const bookingsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: bookings.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
        bookingsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: bookings.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ClientController::bookings
 * @see app/Http/Controllers/Api/ClientController.php:44
 * @route '/api/client/bookings'
 */
        bookingsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: bookings.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    bookings.form = bookingsForm
/**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
export const payments = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payments.url(options),
    method: 'get',
})

payments.definition = {
    methods: ["get","head"],
    url: '/api/client/payments',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
payments.url = (options?: RouteQueryOptions) => {
    return payments.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
payments.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payments.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
payments.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: payments.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
    const paymentsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: payments.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
        paymentsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: payments.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ClientController::payments
 * @see app/Http/Controllers/Api/ClientController.php:55
 * @route '/api/client/payments'
 */
        paymentsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: payments.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    payments.form = paymentsForm
/**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
export const support = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: support.url(options),
    method: 'get',
})

support.definition = {
    methods: ["get","head"],
    url: '/api/client/support',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
support.url = (options?: RouteQueryOptions) => {
    return support.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
support.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: support.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
support.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: support.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
    const supportForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: support.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
        supportForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: support.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\ClientController::support
 * @see app/Http/Controllers/Api/ClientController.php:74
 * @route '/api/client/support'
 */
        supportForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: support.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    support.form = supportForm
/**
* @see \App\Http\Controllers\Api\ClientController::createSupport
 * @see app/Http/Controllers/Api/ClientController.php:93
 * @route '/api/client/support'
 */
export const createSupport = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createSupport.url(options),
    method: 'post',
})

createSupport.definition = {
    methods: ["post"],
    url: '/api/client/support',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ClientController::createSupport
 * @see app/Http/Controllers/Api/ClientController.php:93
 * @route '/api/client/support'
 */
createSupport.url = (options?: RouteQueryOptions) => {
    return createSupport.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::createSupport
 * @see app/Http/Controllers/Api/ClientController.php:93
 * @route '/api/client/support'
 */
createSupport.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createSupport.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::createSupport
 * @see app/Http/Controllers/Api/ClientController.php:93
 * @route '/api/client/support'
 */
    const createSupportForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createSupport.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::createSupport
 * @see app/Http/Controllers/Api/ClientController.php:93
 * @route '/api/client/support'
 */
        createSupportForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createSupport.url(options),
            method: 'post',
        })
    
    createSupport.form = createSupportForm
/**
* @see \App\Http\Controllers\Api\ClientController::updateProfile
 * @see app/Http/Controllers/Api/ClientController.php:138
 * @route '/api/client/profile'
 */
export const updateProfile = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateProfile.url(options),
    method: 'put',
})

updateProfile.definition = {
    methods: ["put"],
    url: '/api/client/profile',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\ClientController::updateProfile
 * @see app/Http/Controllers/Api/ClientController.php:138
 * @route '/api/client/profile'
 */
updateProfile.url = (options?: RouteQueryOptions) => {
    return updateProfile.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::updateProfile
 * @see app/Http/Controllers/Api/ClientController.php:138
 * @route '/api/client/profile'
 */
updateProfile.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateProfile.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::updateProfile
 * @see app/Http/Controllers/Api/ClientController.php:138
 * @route '/api/client/profile'
 */
    const updateProfileForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateProfile.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::updateProfile
 * @see app/Http/Controllers/Api/ClientController.php:138
 * @route '/api/client/profile'
 */
        updateProfileForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateProfile.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateProfile.form = updateProfileForm
/**
* @see \App\Http\Controllers\Api\ClientController::updateLanguage
 * @see app/Http/Controllers/Api/ClientController.php:127
 * @route '/api/user/language'
 */
export const updateLanguage = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateLanguage.url(options),
    method: 'patch',
})

updateLanguage.definition = {
    methods: ["patch"],
    url: '/api/user/language',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Api\ClientController::updateLanguage
 * @see app/Http/Controllers/Api/ClientController.php:127
 * @route '/api/user/language'
 */
updateLanguage.url = (options?: RouteQueryOptions) => {
    return updateLanguage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ClientController::updateLanguage
 * @see app/Http/Controllers/Api/ClientController.php:127
 * @route '/api/user/language'
 */
updateLanguage.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateLanguage.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Api\ClientController::updateLanguage
 * @see app/Http/Controllers/Api/ClientController.php:127
 * @route '/api/user/language'
 */
    const updateLanguageForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateLanguage.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\ClientController::updateLanguage
 * @see app/Http/Controllers/Api/ClientController.php:127
 * @route '/api/user/language'
 */
        updateLanguageForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateLanguage.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateLanguage.form = updateLanguageForm
const ClientController = { dashboard, bookings, payments, support, createSupport, updateProfile, updateLanguage }

export default ClientController