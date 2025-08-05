import { Plugin } from "@elizaos/core";
import { graceSherpaAction } from "./actions/grace-sherpa-simple.js";

const gracePlugin: Plugin = {
    name: "grace-sherpa",
    description: "Grace Fletcher - Senior Sherpa guiding families through senior living discovery",
    actions: [graceSherpaAction]
};

export default gracePlugin;
