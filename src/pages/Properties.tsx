import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Bed, Bath, Square, Search, MapPin } from 'lucide-react';
import { getProperties } from '../services';
import type { Property } from '../types/property';
import { formatRefId } from '../utils/formatters';

function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'rent'>(
    (searchParams.get('type') as 'sale' | 'rent') || 'all'
  );
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest'>('newest');

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const propertiesList = await getProperties();
        setProperties(propertiesList);
      } catch (error) {
        console.error('Erro ao carregar imóveis:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProperties();
  }, []);

  const filteredAndSortedProperties = React.useMemo(() => {
    let result = [...properties];
    // Aplicar filtros
    result = result.filter(property => {
      // Filtrar pelo tipo
      if (filterType !== 'all' && property.type !== filterType) {
        return false;
      }
      // Filtrar pela localização (case-insensitive)
      if (searchLocation) {
        const locationMatch = property.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
                              property.title.toLowerCase().includes(searchLocation.toLowerCase());
        if (!locationMatch) {
          return false;
        }
      }
      return true;
    });

    // Aplicar ordenação
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        console.warn('Ordenação inválida:', sortBy);
    }
    return result;
  }, [properties, filterType, searchLocation, sortBy]);

  const handleFilterChange = (type: 'all' | 'sale' | 'rent') => {
    setFilterType(type);
    if (type === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', type);
    }
    setSearchParams(searchParams);
  };

  const handleLocationSearch = (location: string) => {
    setSearchLocation(location);
    if (location) {
      searchParams.set('location', location);
    } else {
      searchParams.delete('location');
    }
    setSearchParams(searchParams);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Carregando imóveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-blue-600 text-white py-8 md:py-12 -mx-4 px-4 sm:-mx-0 sm:rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Encontre o Imóvel Perfeito
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-6 md:mb-8">
            Explore nossa seleção de imóveis para venda e aluguel
          </p>
        </div>
      </div>
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por localização..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
              value={searchLocation}
              onChange={(e) => handleLocationSearch(e.target.value)}
            />
          </div>
          {/* Type Filter */}
          <select 
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value as 'all' | 'sale' | 'rent')}
          >
            <option value="all">Todos os Tipos</option>
            <option value="sale">Para Venda</option>
            <option value="rent">Para Alugar</option>
          </select>
          {/* Sort By */}
          <select
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price-asc' | 'price-desc' | 'newest')}
          >
            <option value="newest">Mais Recentes</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
          </select>
        </div>
      </div>
      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {filteredAndSortedProperties.length} {filteredAndSortedProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
        </p>
      </div>
      {/* Properties Grid */}
      {filteredAndSortedProperties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Nenhum imóvel encontrado com os filtros selecionados.</p>
          <button
            onClick={() => {
              setFilterType('all');
              setSearchLocation('');
              setSortBy('newest');
              searchParams.delete('type');
              searchParams.delete('location');
              setSearchParams(searchParams);
            }}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProperties.map((property) => (
            <div 
              key={property.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Property Image */}
              <Link to={`/properties/${property.id}`}>
              <div className="relative h-48 sm:h-56 bg-gray-200">
                {property.images && property.images.length > 0 && (
                  <img
                    src={property.images?.[property.coverPhotoIndex || 0] || property.images?.[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                )}
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {property.type === 'sale' ? 'Venda' : 'Aluguel'}
                </div>
                {property.ref_id && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {formatRefId(property.ref_id)}
                  </div>
                )}
                {property.isFeatured && (
                  <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    Destaque
                  </div>
                )}
              </div>
              </Link>
              {/* Property Details */}
              <div className="p-4">
                <Link to={`/properties/${property.id}`}>
                <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {property.title}
                </h2>
                </Link>
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{property.location}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Bed className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <span className="text-sm text-gray-600">{property.bedrooms} Quartos</span>
                  </div>
                  <div className="text-center">
                    <Bath className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <span className="text-sm text-gray-600">{property.bathrooms} Banheiros</span>
                  </div>
                  <div className="text-center">
                    <Square className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <span className="text-sm text-gray-600">{property.area}m²</span>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600 mb-4">
                  {property.price === 0 && property.type === 'rent' ? 'A consultar!' : `R$ ${property.price.toLocaleString('pt-BR')}${property.type === 'rent' ? '/mês' : ''}`}
                </div>
                {/* Botão Ver mais detalhes */}
                <Link 
                  to={`/properties/${property.id}`}
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Ver mais detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Properties;