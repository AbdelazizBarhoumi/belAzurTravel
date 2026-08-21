import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\BookingController::store
 * @see app/Http/Controllers/Api/BookingController.php:53
 * @route '/api/bookings'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/bookings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BookingController::store
 * @see app/Http/Controllers/Api/BookingController.php:53
 * @route '/api/bookings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BookingController::store
 * @see app/Http/Controllers/Api/BookingController.php:53
 * @route '/api/bookings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::store
 * @see app/Http/Controllers/Api/BookingController.php:53
 * @route '/api/bookings'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::store
 * @see app/Http/Controllers/Api/BookingController.php:53
 * @route '/api/bookings'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/bookings/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
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
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\BookingController::show
 * @see app/Http/Controllers/Api/BookingController.php:40
 * @route '/api/bookings/{id}'
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
* @see \App\Http\Controllers\Api\BookingController::cancel
 * @see app/Http/Controllers/Api/BookingController.php:234
 * @route '/api/bookings/{id}/cancel'
 */
export const cancel = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/api/bookings/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BookingController::cancel
 * @see app/Http/Controllers/Api/BookingController.php:234
 * @route '/api/bookings/{id}/cancel'
 */
cancel.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancel.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BookingController::cancel
 * @see app/Http/Controllers/Api/BookingController.php:234
 * @route '/api/bookings/{id}/cancel'
 */
cancel.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::cancel
 * @see app/Http/Controllers/Api/BookingController.php:234
 * @route '/api/bookings/{id}/cancel'
 */
    const cancelForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::cancel
 * @see app/Http/Controllers/Api/BookingController.php:234
 * @route '/api/bookings/{id}/cancel'
 */
        cancelForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, options),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/admin/bookings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\BookingController::index
 * @see app/Http/Controllers/Api/BookingController.php:35
 * @route '/api/admin/bookings'
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
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/confirm'
 */
const approve82fbaaa626a40c916f1b775d637775e8 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve82fbaaa626a40c916f1b775d637775e8.url(args, options),
    method: 'post',
})

approve82fbaaa626a40c916f1b775d637775e8.definition = {
    methods: ["post"],
    url: '/api/admin/bookings/{id}/confirm',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/confirm'
 */
approve82fbaaa626a40c916f1b775d637775e8.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return approve82fbaaa626a40c916f1b775d637775e8.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/confirm'
 */
approve82fbaaa626a40c916f1b775d637775e8.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve82fbaaa626a40c916f1b775d637775e8.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/confirm'
 */
    const approve82fbaaa626a40c916f1b775d637775e8Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: approve82fbaaa626a40c916f1b775d637775e8.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/confirm'
 */
        approve82fbaaa626a40c916f1b775d637775e8Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: approve82fbaaa626a40c916f1b775d637775e8.url(args, options),
            method: 'post',
        })
    
    approve82fbaaa626a40c916f1b775d637775e8.form = approve82fbaaa626a40c916f1b775d637775e8Form
    /**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/approve'
 */
const approve4550a1d0104bee8ea60af4bb3c992b34 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve4550a1d0104bee8ea60af4bb3c992b34.url(args, options),
    method: 'post',
})

approve4550a1d0104bee8ea60af4bb3c992b34.definition = {
    methods: ["post"],
    url: '/api/admin/bookings/{id}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/approve'
 */
approve4550a1d0104bee8ea60af4bb3c992b34.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return approve4550a1d0104bee8ea60af4bb3c992b34.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/approve'
 */
approve4550a1d0104bee8ea60af4bb3c992b34.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve4550a1d0104bee8ea60af4bb3c992b34.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/approve'
 */
    const approve4550a1d0104bee8ea60af4bb3c992b34Form = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: approve4550a1d0104bee8ea60af4bb3c992b34.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::approve
 * @see app/Http/Controllers/Api/BookingController.php:321
 * @route '/api/admin/bookings/{id}/approve'
 */
        approve4550a1d0104bee8ea60af4bb3c992b34Form.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: approve4550a1d0104bee8ea60af4bb3c992b34.url(args, options),
            method: 'post',
        })
    
    approve4550a1d0104bee8ea60af4bb3c992b34.form = approve4550a1d0104bee8ea60af4bb3c992b34Form

export const approve = {
    '/api/admin/bookings/{id}/confirm': approve82fbaaa626a40c916f1b775d637775e8,
    '/api/admin/bookings/{id}/approve': approve4550a1d0104bee8ea60af4bb3c992b34,
}

/**
* @see \App\Http\Controllers\Api\BookingController::reject
 * @see app/Http/Controllers/Api/BookingController.php:407
 * @route '/api/admin/bookings/{id}/reject'
 */
export const reject = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/api/admin/bookings/{id}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BookingController::reject
 * @see app/Http/Controllers/Api/BookingController.php:407
 * @route '/api/admin/bookings/{id}/reject'
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
* @see \App\Http\Controllers\Api\BookingController::reject
 * @see app/Http/Controllers/Api/BookingController.php:407
 * @route '/api/admin/bookings/{id}/reject'
 */
reject.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::reject
 * @see app/Http/Controllers/Api/BookingController.php:407
 * @route '/api/admin/bookings/{id}/reject'
 */
    const rejectForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reject.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::reject
 * @see app/Http/Controllers/Api/BookingController.php:407
 * @route '/api/admin/bookings/{id}/reject'
 */
        rejectForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reject.url(args, options),
            method: 'post',
        })
    
    reject.form = rejectForm
/**
* @see \App\Http\Controllers\Api\BookingController::adminCancel
 * @see app/Http/Controllers/Api/BookingController.php:434
 * @route '/api/admin/bookings/{id}/cancel'
 */
export const adminCancel = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adminCancel.url(args, options),
    method: 'post',
})

adminCancel.definition = {
    methods: ["post"],
    url: '/api/admin/bookings/{id}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BookingController::adminCancel
 * @see app/Http/Controllers/Api/BookingController.php:434
 * @route '/api/admin/bookings/{id}/cancel'
 */
adminCancel.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return adminCancel.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BookingController::adminCancel
 * @see app/Http/Controllers/Api/BookingController.php:434
 * @route '/api/admin/bookings/{id}/cancel'
 */
adminCancel.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adminCancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\BookingController::adminCancel
 * @see app/Http/Controllers/Api/BookingController.php:434
 * @route '/api/admin/bookings/{id}/cancel'
 */
    const adminCancelForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: adminCancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\BookingController::adminCancel
 * @see app/Http/Controllers/Api/BookingController.php:434
 * @route '/api/admin/bookings/{id}/cancel'
 */
        adminCancelForm.post = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: adminCancel.url(args, options),
            method: 'post',
        })
    
    adminCancel.form = adminCancelForm
const BookingController = { store, show, cancel, index, approve, reject, adminCancel }

export default BookingController