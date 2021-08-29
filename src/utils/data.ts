import {Barcode, CatalogItem, CatalogResult, Company, Supplier} from "../models/models";
import parse from "csv-parse/lib/sync";
import fs from 'fs';

export const writeMergedCatalog = (catalog: CatalogResult[], filePath: string): void => {
    if (fs.existsSync(filePath)) {
        throw new Error('The destination file already exists');
    }

    const result: string[][] = [
        ['SKU', 'Description', 'Source'],
        ...catalog.map((result: CatalogResult) => [result.item.sku, result.item.description, result.source.name]),
    ];

    const contents: string = result
        .map(row => row.join(","))
        .join("\n");

    fs.writeFileSync(filePath, contents);
}

export const parseCompanyData = (name: string, supplierFilePath: string, barcodeFilePath: string, catalogFilePath: string): Company => {
    const suppliers: Supplier[] = parseSupplierData(parseData(supplierFilePath));
    const barcodes: Barcode[] = parseBarcodeData(parseData(barcodeFilePath), suppliers);
    const catalog: CatalogItem[] = parseCatalogData(parseData(catalogFilePath), barcodes);
    return {name, catalog, suppliers};
}

export const parseCatalogData = (catalogRows: string[][], barcodes: Barcode[]): CatalogItem[] => {
    const barcodesBySku: {[sku: string]: Barcode[]} = {};
    barcodes.forEach((barcode: Barcode) => {
        if (!(barcode.sku in barcodesBySku)) {
            barcodesBySku[barcode.sku] = [];
        }
        barcodesBySku[barcode.sku].push(barcode);
    });

    return catalogRows.map((record: string[], index: number): CatalogItem => {
        if (record.length !== 2 || !record[0] || !record[1]) {
            throw new Error('Invalid catalog data at index ' + index);
        }

        if (!barcodesBySku[record[0]]) {
            throw new Error('No barcodes for SKU ' + record[0] + ' found');
        }

        return {
            barcodes: barcodesBySku[record[0]],
            sku: record[0],
            description: record[1],
        };
    });
}

export const parseBarcodeData = (barcodeRows: string[][], suppliers: Supplier[]): Barcode[] => {
    // Reduce the suppliers into a Map indexed by ID so that we can assign them to barcodes much faster (instead of
    // looping through the entire array every iteration)
    const supplierById: {[id: string]: Supplier} = {};
    suppliers.forEach((supplier: Supplier) => supplierById[supplier.id] = supplier);

    return barcodeRows.map((record: string[], index: number): Barcode => {
        if (record.length !== 3 || !record[0] || !record[1] || !record[2]) {
            throw new Error('Invalid barcode supplied at index ' + index);
        }

        if (!supplierById[record[0]]) {
            throw new Error('Supplier ' + record[0] + ' not found');
        }

        return {
            supplier: supplierById[record[0]],
            sku: record[1],
            barcode: record[2],
        }
    });
}

export const parseSupplierData = (supplierRows: string[][]): Supplier[] => {
    return supplierRows.map((record: string[], index: number): Supplier => {
        if (!record[0] || !record[1] || record.length !== 2) {
            throw new Error('Invalid supplier data at index ' + index);
        }

        return {
            id: record[0],
            name: record[1],
        };
    });
}

/**
 * Synchronously parse a CSV file and return it's records. This isn't done asynchronously as the application relies on
 * the entire dataset for its functioning.
 */
export const parseData = (csvFilePath: string): string[][] => {
    if (!fs.existsSync(csvFilePath)) {
        throw new Error('Given file cannot be read: ' + csvFilePath);
    }

    return parse(fs.readFileSync(csvFilePath), {
        skip_empty_lines: true,
    }).slice(1);
}
