const r=L.qaReader||L.currentReader(),v=r._internalReader._primaryView,p=v._iframeWindow.PDFViewerApplication.pdfDocument;
const describe=x=>x?{keys:Object.keys(x),methods:Object.getOwnPropertyNames(Object.getPrototypeOf(x)||{}),members:Object.fromEntries(Object.entries(x).slice(0,12).map(([k,v])=>[k,typeof v==='object'&&v?Object.keys(v).slice(0,20):typeof v]))}:null;
return {processed:typeof p.getProcessedData,docData:describe(v._documentData),pageData:describe(v._pdfPages),renderer:describe(v._pdfRenderer),pdfMethods:Object.getOwnPropertyNames(Object.getPrototypeOf(p))};
