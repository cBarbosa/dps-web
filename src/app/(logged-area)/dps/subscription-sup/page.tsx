import React from 'react';

export default async function Page({
	searchParams,
}: {
	searchParams: { page: string }
}) {

    return(
        <div>
            <h1>Page</h1>
            <p>Welcome to the Page!</p>
        </div>
    );
}
