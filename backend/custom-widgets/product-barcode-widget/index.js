// medusajs-v2-widget/index.js

const Medusa = require('@medusajs/js-sdk');
const Quagga = require("quagga");

module.exports = {
    widget: {
        name: "Product Barcode Manager",
        description: "Manage barcodes for products and variants including inventory scanning.",
        setup: ({ adminApi }) => {
            adminApi.createAdminWidget({
                name: "Product Barcode Widget",
                identifier: "product-barcode-widget",
                type: "custom-widget",
                inject: {
                    pages: ["product-view", "variant-view"],
                },
                component: async ({ product, variant, setData }) => {
                    const div = document.createElement('div');
                    const h3 = document.createElement('h3');
                    h3.textContent = 'Barcode Manager';

                    const label1 = document.createElement('label');
                    label1.htmlFor = 'caseBarcode';
                    label1.textContent = 'Case Barcode:';

                    const input1 = document.createElement('input');
                    input1.type = 'text';
                    input1.id = 'caseBarcode';
                    input1.placeholder = 'Enter case barcode';
                    input1.addEventListener('change', (e) => setData({ caseBarcode: e.target.value }));

                    const label2 = document.createElement('label');
                    label2.htmlFor = 'caseValue';
                    label2.textContent = 'Case Value:';

                    const input2 = document.createElement('input');
                    input2.type = 'number';
                    input2.id = 'caseValue';
                    input2.placeholder = 'Enter case quantity';
                    input2.addEventListener('change', (e) => setData({ caseValue: e.target.value }));

                    div.appendChild(h3);
                    div.appendChild(label1);
                    div.appendChild(input1);
                    div.appendChild(label2);
                    div.appendChild(input2);

                    return div;
            },
            });

            adminApi.createAdminMenu({
                name: "Inventory Scanner",
                identifier: "inventory-scanner-menu",
                location: "inventory",
                onClick: async () => {
                    adminApi.redirectTo("/inventory-scanner");
                },
            });
        },
    },

    routes: ({ adminApi }) => {
        adminApi.createRoute({
            path: "/inventory-scanner",
            method: "GET",
            handler: async (req, res) => {
                res.render("inventoryScannerPage", {
                    title: "Inventory Scanner",
                    barcodeList: [],
                });
            },
        });
    },

    actions: ({ adminApi, inventoryApi }) => {
        adminApi.onEvent("barcode-scanned", async ({ barcode }) => {
            const product = await inventoryApi.findProductByBarcode(barcode);

            if (!product) {
                return adminApi.showModal({
                    title: "Barcode Not Found",
                    content: "Assign the scanned barcode to a product or case.",
                });
            }

            const updatedInventory = await inventoryApi.updateInventory({
                barcode,
                newQuantity: product.quantity + 1,
            });

            adminApi.updateWidgetState("inventory-scanner", {
                barcodeList: updatedInventory,
            });
        });

        adminApi.createRoute({
            path: "/save-barcode-assignments",
            method: "POST",
            handler: async (req, res) => {
                const { barcodeAssignments } = req.body;

                await inventoryApi.saveAssignments(barcodeAssignments);
                res.json({ success: true });
            },
        });
    },

    widgets: ["product-barcode-widget", "inventory-scanner-menu"],
};
