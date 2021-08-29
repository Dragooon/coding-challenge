import {parseCompanyData, writeMergedCatalog} from "./utils/data";
import {mergeCompanyCatalogs} from "./utils/merge-company-catalogs";
import inquirer from "inquirer";

export const mergeCompanies = (args: string[]): void => {
    const parentCompany = parseCompanyData(args[0], args[1], args[2], args[3]);
    const childCompany = parseCompanyData(args[4], args[5], args[6], args[7]);
    const mergedData = mergeCompanyCatalogs(parentCompany, childCompany);
    writeMergedCatalog(mergedData, args[8]);
};

inquirer
    .prompt([
        {type: 'input', name: 'parent_company', message: 'What is the name of the parent company?'},
        {type: 'input', name: 'parent_supplier', message: 'Parent supplier file'},
        {type: 'input', name: 'parent_barcodes', message: 'Parent barcodes file'},
        {type: 'input', name: 'parent_catalog', message: 'Parent catalog file'},
        {type: 'input', name: 'child_company', message: 'What is the name of the child company?'},
        {type: 'input', name: 'child_supplier', message: 'Child supplier file'},
        {type: 'input', name: 'child_barcodes', message: 'Child barcodes file'},
        {type: 'input', name: 'child_catalog', message: 'Child catalog file'},
        {type: 'input', name: 'output', message: 'Where would you like to save the result?'},
    ])
    .then(answers => mergeCompanies(Object.values(answers)))
    .catch(error => {
        console.log(error);
    });

