import React from 'react'
import {Link} from 'react-router-dom'

export default function header() {
    return (
        <>
            <ul>

                  <Link to="/">Home</Link>
                  {" "}
                  <Link to="/user">User</Link>
                  {" "}
                  <Link to="/token">Token</Link>
            </ul>
        </>
    )
}
