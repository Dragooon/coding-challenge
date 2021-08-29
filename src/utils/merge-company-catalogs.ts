import {Barcode, CatalogItem, CatalogResult, Company} from "../models/models";

export const mergeCompanyCatalogs = (parent: Company, child: Company): CatalogResult[] => {
    const result: CatalogResult[] = parent.catalog.map((item: CatalogItem): CatalogResult => ({
        source: parent,
        item: item,
    }));

    // Flatten the list of barcodes into a single array to check for duplicate products. Since we only keep one entry
    // for duplicate products, we can just eliminate them faster this way.
    const initialBarcodes: string[] = parent.catalog.reduce((barcodes: string[], item: CatalogItem): string[] => [
        ...barcodes,
        ...item.barcodes.map((barcode: Barcode): string => barcode.barcode),
    ], []);

    child.catalog
        // Filter out child company's products which already exist in the parent companies
        .filter(
            (item: CatalogItem): boolean =>
                !item.barcodes.some((barcode: Barcode): boolean => initialBarcodes.some((code: string): boolean => code === barcode.barcode))
        )
        // Put the remaining products into the result set
        .forEach((item: CatalogItem) => result.push({
            source: child,
            item: item,
        }));

    return result;
}
