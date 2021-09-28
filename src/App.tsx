/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { MainWindow } from "./lib/MainWindow";

function App(): JSX.Element {
    return (
        <React.StrictMode>
            <MainWindow></MainWindow>
        </React.StrictMode>
    );
}

export default App;
