import {parseBarcodeData, parseCatalogData, parseData, parseSupplierData, writeMergedCatalog} from "./data";
import {Barcode, CatalogItem, CatalogResult, Supplier} from "../models/models";
import fs from "fs";
import {mocked} from "ts-jest/utils";

jest.mock('fs');

describe('supplier tests', () => {
    test('parse supplier data', () => {
        const testSupplierData: string[][] = [
            ['00001', 'Twitterbridge'],
            ['00002', 'Thoughtsphere'],
            ['00003', 'Photobug']
        ];

        const suppliers = parseSupplierData(testSupplierData);
        expect(suppliers).toHaveLength(testSupplierData.length);

        testSupplierData.forEach(testData => {
            expect(suppliers.filter((supplier: Supplier) => supplier.id === testData[0] && supplier.name === testData[1])).toHaveLength(1);
        })
    });

    test('failure on invalid data', () => {
        const testSupplierData: string[][] = [
            ['00001', 'Twitterbridge'],
            ['00002'],
        ];

        expect(() => parseSupplierData(testSupplierData)).toThrow();
    })
});

describe('product and barcode tests', () => {
    const supplier: Supplier = {id: '00001', name: 'Base supplier'};
    const barcodes: Barcode[] = [
        {barcode: 'z2783613083817', sku: '647-vyk-317', supplier: supplier},
        {barcode: 'z2783613083818', sku: '647-vyk-317', supplier: supplier},
        {barcode: 'z2783613083819', sku: '647-vyk-317', supplier: supplier},
    ];

    describe('barcode tests', () => {
        test('parse valid barcode data', () => {
            const testBarcodeData: string[][] = [
                ['00001','647-vyk-317','z2783613083817'],
                ['00001','647-vyk-317','z2783613083818'],
                ['00001','647-vyk-317','z2783613083819'],
            ];

            const barcodes = parseBarcodeData(testBarcodeData, [supplier]);
            expect(barcodes).toHaveLength(testBarcodeData.length);

            testBarcodeData.forEach(testData => {
                expect(
                    barcodes.filter((barcode: Barcode) => barcode.sku === testData[1] && barcode.barcode === testData[2] && barcode.supplier.id === testData[0])
                ).toHaveLength(1);
            });
        });

        test('fail on invalid barcode data', () => {
            const testBarcodeData: string[][] = [
                ['00001','647-vyk-317','z2783613083817'],
                ['00001','647-vyk-317'],
            ];
            expect(() => parseBarcodeData(testBarcodeData, [supplier])).toThrow();
        });

        test('fail on invalid supplier', () => {
            const testBarcodeData: string[][] = [
                ['000015','647-vyk-317','z2783613083817'],
            ];

            expect(() => parseBarcodeData(testBarcodeData, [supplier])).toThrow('Supplier 000015 not found');
        });
    });

    describe('catalog test', () => {
        test('parse valid catalog data', () => {
            const testCatalogData: string[][] = [
                ['647-vyk-317', 'Walkers Special Old Whiskey'],
            ];

            const catalog = parseCatalogData(testCatalogData, barcodes);
            expect(catalog).toHaveLength(testCatalogData.length);

            testCatalogData.forEach(testData => {
                const catalogItem = catalog.filter((item: CatalogItem) => item.sku === testData[0] && item.description === testData[1]);
                expect(catalogItem).toHaveLength(1);

                expect(catalogItem[0].barcodes.filter((barcode: Barcode) => barcode.sku !== testData[0])).toHaveLength(0);
            });
        });

        test('fail on invalid data', () => {
            const testCatalogData: string[][] = [
                ['647-vyk-317', 'Walkers Special Old Whiskey', 'invalid column'],
            ];
            expect(() => parseCatalogData(testCatalogData, barcodes)).toThrow();
        });

        test('fail on invalid SKU', () => {
            const testCatalogData: string[][] = [
                ['647-vyk', 'Walkers Special Old Whiskey'],
            ];
            expect(() => parseCatalogData(testCatalogData, barcodes)).toThrow('No barcodes for SKU 647-vyk found');
        });
    });
});

describe('parse data tests', () => {
    const mockedFs = mocked(fs, true);

    test('skip header row', () => {
        mockedFs.existsSync.mockReturnValueOnce(true);
        mockedFs.readFileSync.mockReturnValueOnce(
            "head1,head2\ntest1,test2\ntest3,test4"
        );

        const parsedRows = parseData('test.csv');
        expect(parsedRows).toHaveLength(2);
        expect(parsedRows[0][0]).toEqual("test1");
    });

    test('should throw error on missing file', () => {
        mockedFs.existsSync.mockReturnValueOnce(false);

        expect(() => parseData('test.csv')).toThrow();
    });
});

describe('write merge data', () => {
    const catalog: CatalogResult[] = [
        {
            item: {sku: 'test-sku', description: 'test product', barcodes: []},
            source: {name: 'A', catalog: [], suppliers: []},
        }
    ];
    const validData = "SKU,Description,Source\ntest-sku,test product,A";
    const mockedFs = mocked(fs, true);

    test('should write valid data', () => {
        mockedFs.existsSync.mockReturnValueOnce(false);

        writeMergedCatalog(catalog, "test.csv");
        expect(mockedFs.writeFileSync).toBeCalledWith("test.csv", validData);
    });

    test('error on existing file', () => {
        mockedFs.existsSync.mockReturnValueOnce(true);

        expect(() => writeMergedCatalog(catalog, "test.csv")).toThrow();
    })
})
