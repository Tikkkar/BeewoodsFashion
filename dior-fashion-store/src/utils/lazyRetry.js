import { lazy } from "react";

/**
 * A wrapper around React.lazy that attempts to reload the page
 * if the chunk fails to load. This handles cases where a new deployment
 * has invalidated old chunks.
 * 
 * @param {Function} componentImport - The dynamic import function e.g. () => import('./Component')
 * @returns {React.Component} - The lazy loaded component
 */
export const lazyRetry = (componentImport) => {
    return lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.localStorage.getItem("page-has-been-force-refreshed") || "false"
        );

        try {
            const component = await componentImport();
            window.localStorage.setItem("page-has-been-force-refreshed", "false");
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // Assuming that the user is not on the latest version of the application.
                // Let's refresh the page immediately.
                window.localStorage.setItem("page-has-been-force-refreshed", "true");
                window.location.reload();

                // Return a never-resolving promise to prevent the error from bubbling up
                // while the page reloads
                return new Promise(() => { });
            }

            // The page has already been reloaded
            // Assuming that user is already using the latest version of the application.
            // Let's let the application crash and raise the error.
            throw error;
        }
    });
};
