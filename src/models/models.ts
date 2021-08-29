export interface Supplier {
    id: string;
    name: string;
}

export interface Barcode {
    supplier: Supplier;
    sku: string;
    barcode: string;
}

export interface CatalogItem {
    sku: string;
    barcodes: Barcode[];
    description: string;
}

export interface CatalogResult {
    item: CatalogItem;
    source: Company;
}

export interface Company {
    name: string;
    catalog: CatalogItem[];
    suppliers: Supplier[]
}
