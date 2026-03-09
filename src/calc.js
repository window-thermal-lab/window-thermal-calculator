// window thermal calculator

const clientId = "mm1001";

fetch(`config/clients/${clientId}.json`)
  .then(r => r.json())
  .then(client => {
    console.log("client config:", client);
  });

fetch("config/common.json")
  .then(r => r.json())
  .then(common => {
    console.log("common config:", common);
  });
