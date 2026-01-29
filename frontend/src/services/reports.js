import api from "./api";

export async function downloadReport(type, format) {
  // type: 'attendance' | 'marks'
  // format: 'pdf' | 'xlsx'
  const url = `/api/reports/${type}?format=${format}`;
  
  const response = await api.get(url, {
    responseType: "blob", // Important for file download
  });
  
  // Create a blob link to download
  const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = urlBlob;
  link.setAttribute(
    "download", 
    `${type}_report.${format === "pdf" ? "pdf" : "xlsx"}`
  );
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}
