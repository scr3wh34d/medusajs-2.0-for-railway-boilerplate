// medusajs-v2-widget/index.js

const Medusa = require("@medusajs/sdk");
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
                    return (
                        <div>
                            <h3>Barcode Manager</h3>
                            <label htmlFor="caseBarcode">Case Barcode:</label>
                            <input
                                type="text"
                                id="caseBarcode"
                                placeholder="Enter case barcode"
                                onChange={(e) => setData({ caseBarcode: e.target.value })}
                            />
                            <label htmlFor="caseValue">Case Value:</label>
                            <input
                                type="number"
                                id="caseValue"
                                placeholder="Enter case quantity"
                                onChange={(e) => setData({ caseValue: e.target.value })}
                            />
                        </div>
                    );
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
