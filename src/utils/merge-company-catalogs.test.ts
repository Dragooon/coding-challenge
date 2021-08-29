import {CatalogItem, CatalogResult, Company, Supplier} from "../models/models";
import {mergeCompanyCatalogs} from "./merge-company-catalogs";

describe('merge company catalogs', () => {
    // Define a fake parent company
    const parentSuppliers: Supplier[] = [{id: '00001', name: 'Base supplier 1'}, {id: '00001', name: 'Base supplier 2'}];
    const parentCatalog: CatalogItem[] = [
        {
            sku: "647-vyk-317",
            description: "test product",
            barcodes: [
                {barcode: 'z2783613083817', sku: '647-vyk-317', supplier: parentSuppliers[0]},
                {barcode: 'z2783613083818', sku: '647-vyk-317', supplier: parentSuppliers[0]},
                {barcode: 'z2783613083819', sku: '647-vyk-317', supplier: parentSuppliers[1]},
            ]
        },
        {
            sku: "pc-647-vyk",
            description: "parent test product",
            barcodes: [
                {barcode: 'z2783613083820', sku: 'pc-647-vyk', supplier: parentSuppliers[0]},
            ]
        },
    ];
    const parentCompany: Company = {
        name: "A",
        catalog: parentCatalog,
        suppliers: parentSuppliers,
    };

    // Define a fake child company
    const childSuppliers: Supplier[] = [{id: '00001', name: 'Child supplier'}];
    const childCatalog: CatalogItem[] = [
        // This product is a duplicate of the one in parent
        {
            sku: "abc-vyk-417",
            description: "test child product",
            barcodes: [
                {barcode: 'z2783613083817', sku: 'abc-vyk-417', supplier: childSuppliers[0]},
                {barcode: 'abc01291100aac', sku: 'abc-vyk-417', supplier: childSuppliers[0]},
            ]
        },
        // This is a new product
        {
            sku: "abc-vyk-520",
            description: "test child product 2",
            barcodes: [
                {barcode: 'asa0012010aas', sku: 'abc-vyk-520', supplier: childSuppliers[0]},
            ]
        },
        // This is another new product
        {
            sku: "abc-vyk-new",
            description: "test child product 3",
            barcodes: [
                {barcode: 'testproductabbca0010', sku: 'abc-vyk-new', supplier: childSuppliers[0]},
            ]
        },
    ];
    const childCompany: Company = {
        name: "B",
        catalog: childCatalog,
        suppliers: childSuppliers,
    };

    test('valid merged data', () => {
        const result = mergeCompanyCatalogs(parentCompany, childCompany);
        expect(result).toHaveLength(4);

        // The products in parent company
        expect(result.filter((item: CatalogResult) => item.source.name === parentCompany.name && item.item.sku === parentCatalog[0].sku)).toHaveLength(1);
        expect(result.filter((item: CatalogResult) => item.source.name === parentCompany.name && item.item.sku === parentCatalog[1].sku)).toHaveLength(1);

        // The products in child company
        expect(result.filter((item: CatalogResult) => item.source.name === childCompany.name && item.item.sku === childCatalog[1].sku)).toHaveLength(1);
        expect(result.filter((item: CatalogResult) => item.source.name === childCompany.name && item.item.sku === childCatalog[2].sku)).toHaveLength(1);

        // Ensure that the duplicate product doesn't get added in
        expect(result.filter((item: CatalogResult) => item.source.name === childCompany.name && item.item.sku === childCatalog[0].sku)).toHaveLength(0);
    });
});
