export const formatRefId = (id: number): string => {
  if (!id) return '';
  return `Ref. ${String(id).padStart(3, '0')}`;
}; 