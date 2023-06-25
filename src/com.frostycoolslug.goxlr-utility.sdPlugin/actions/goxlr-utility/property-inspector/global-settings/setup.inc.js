let globalSettings = [];
let device = undefined;

$PI.onConnected((jsn) => {
    const {actionInfo, appInfo, connection, messageType, port, uuid} = jsn;
    const {payload, context} = actionInfo;
    const {settings} = payload;

    pluginSettings = settings;
    $PI.websocket.send(JSON.stringify({
        event: 'getGlobalSettings',
        context: $PI.uuid
    }))
});

$PI.onDidReceiveGlobalSettings(({payload}) => {
    globalSettings = payload['settings'];

    let address = "localhost:14564";
    if (globalSettings['address'] !== undefined) {
        address = globalSettings['address'];
    }

    console.log("Attempting Connection..");
    canConnect(address).then((success) => {
        if (success) {
            if (globalSettings['address'] === undefined) {
                console.log("Storing Default Address");
                globalSettings['address'] = address;
                $PI.setGlobalSettings(globalSettings);
            }
            loadPlugin();
            return;
        }
        failed();
    });
})

async function canConnect(address) {
    websocket.set_address("ws://" + address + "/api/websocket");
    return await websocket.connect().then(async () => {
        return await websocket.send_daemon_command("GetStatus").then((status) => {
            device = status.Status;
            return true;
        }).catch((e) => {
            console.log("Failed to GetStatus: " + JSON.stringify(e));
            return false;
        });
    }).catch((e) => {
        console.log("Failed to Connect: " + JSON.stringify(e));
        return false;
    });
}

function loadPlugin() {
    console.log("Running Plugin..");

    // Open up the rest of the plugin.
    document.querySelector("#please-wait").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");
    runPlugin();
}

function failed() {
    console.log("Connection Failed");
    document.querySelector("#please-wait").classList.add("hidden");
    document.querySelector("#message").innerHTML = "Cannot find GoXLR Utility"
    document.querySelector("#configure").classList.remove("hidden");
}

console.log("Registering Click..");
document.querySelector("#configure_button").addEventListener('click', (e) => {
    window.open('../../../../setup/setup.html');
});

// Called from the external window after address is set.
window.sendToInspector = (data) => {
    globalSettings = JSON.parse(data);
    $PI.setGlobalSettings(globalSettings);

    // Simply reload the window to take us back to settings.
    location.reload();
};
