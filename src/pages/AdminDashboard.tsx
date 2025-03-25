import React, { useCallback, useState, useEffect, FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Plus, Trash2, X, Star, LogOut, Trees as Tree, Car, Shield, Wind, Refrigerator, Phone, Mail, Image } from 'lucide-react';
import { FaSwimmingPool } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { Property, PropertyFeatures } from '../types/property';
import { createProperty, updateProperty, getProperties, deleteProperty } from '../services/api';
import { supabase, uploadImage, deleteImage, signOut, getUserRole } from '../lib/supabase';

function AdminDashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const [userRole, setUserRole] = useState<'admin' | 'standard'>('standard');
  const [property, setProperty] = useState<Partial<Property>>({
    title: '',
    description: '',
    price: 0,
    location: '',
    type: 'sale',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    images: [],
    features: {
      has_pool: false,
      has_garden: false,
      has_garage: false,
      has_security_system: false,
      has_air_conditioning: false,
      has_premium_appliances: false
    },
    isFeatured: false,
    brokerPhone: '',
    brokerEmail: ''
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Por favor, faça login para continuar');
          navigate('/login');
          return;
        }
        const role = await getUserRole();
        setUserRole(role);
        const propertiesList = await getProperties(true);
        setProperties(propertiesList);
      } catch (error) {
        console.error('Erro ao carregar imóveis:', error);
        toast.error('Erro ao carregar imóveis');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string) => {
    const cleanValue = value.replace(/[^\d,.]/g, '');
    const numericValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.')) || 0;
    return numericValue;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      // Verifica se já tem mais de 12 imagens
      if ((property.images?.length || 0) + acceptedFiles.length > 12) {
        toast.error('Você pode fazer o upload de no máximo 12 imagens.');
        return;
      }
      setIsUploading(true);
      const currentImages = property.images || [];
      const uploadPromises = acceptedFiles.slice(0, 12 - currentImages.length).map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setProperty((prev: Partial<Property>) => ({
        ...prev,
        images: [...currentImages, ...uploadedUrls]
      }));
      // Se for a primeira imagem, define automaticamente como capa
      if (currentImages.length === 0) {
        setCoverPhotoIndex(0);
      }
      toast.success('Imagens enviadas com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
    }
  }, [property.images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: true
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const cursorPosition = e.target.selectionStart || 0;
    const numericValue = parseCurrency(value);
    setProperty((prev: Partial<Property>) => ({
      ...prev,
      price: numericValue
    }));
    setTimeout(() => {
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setProperty((prev: Partial<Property>) => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setProperty((prev: Partial<Property>) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeatureChange = (featureName: keyof PropertyFeatures) => {
    setProperty((prev: Partial<Property>) => {
      // Garantir que features existe
      const currentFeatures = prev.features || {
        has_pool: false,
        has_garden: false,
        has_garage: false,
        has_security_system: false,
        has_air_conditioning: false,
        has_premium_appliances: false
      };
      
      return {
        ...prev,
        features: {
          ...currentFeatures,
          [featureName]: !currentFeatures[featureName]
        }
      };
    });
  };

  const handleBrokerContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'brokerPhone') {
      setBrokerPhone(value);
    } else if (name === 'brokerEmail') {
      setBrokerEmail(value);
    }
  };

  const handleEdit = (propertyToEdit: Property) => {
    setIsEditing(true);
    // Reorganiza as imagens para que a foto de capa seja a primeira
    const images = [...propertyToEdit.images];
    if (propertyToEdit.coverPhotoIndex && propertyToEdit.coverPhotoIndex < images.length) {
      const coverPhoto = images[propertyToEdit.coverPhotoIndex];
      images.splice(propertyToEdit.coverPhotoIndex, 1);
      images.unshift(coverPhoto);
    }
    setProperty({
      ...propertyToEdit,
      images,
      coverPhotoIndex: 0 // Como reorganizamos as imagens, a foto de capa agora é sempre a primeira
    });
    setBrokerPhone(propertyToEdit.brokerPhone || '');
    setBrokerEmail(propertyToEdit.brokerEmail || '');
    setCoverPhotoIndex(0);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Por favor, faça login para continuar');
        navigate('/login');
        return;
      }
      setIsSubmitting(true);
      
      // Garantir que todos os campos obrigatórios estejam presentes
      if (!property.title || !property.description || !property.location) {
        toast.error('Por favor, preencha todos os campos obrigatórios');
        setIsSubmitting(false);
        return;
      }
      
      const propertyData = {
        ...property,
        title: property.title || '',
        description: property.description || '',
        location: property.location || '',
        price: property.price || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area: property.area || 0,
        type: property.type || 'sale',
        images: property.images || [],
        coverPhotoIndex: 0, // Como reorganizamos as imagens, a foto de capa é sempre a primeira
        features: property.features || {
          has_pool: false,
          has_garden: false,
          has_garage: false,
          has_security_system: false,
          has_air_conditioning: false,
          has_premium_appliances: false
        },
        isFeatured: property.isFeatured || false,
        is_featured: (property.isFeatured || false) && userRole === 'admin',
        brokerPhone,
        brokerEmail
      };
      
      if (isEditing && property.id) {
        await updateProperty(property.id, propertyData);
        
        // Atualiza a lista de propriedades com os dados atualizados
        setProperties((prev: Property[]) => prev.map((p: Property) => 
          p.id === property.id ? { 
            ...p, 
            ...propertyData,
            coverPhotoIndex: 0, // Como reorganizamos as imagens, a foto de capa é sempre a primeira
            features: propertyData.features
          } : p
        ));
        
        toast.success('Imóvel atualizado com sucesso!');
      } else {
        const newProperty = await createProperty(propertyData);
        setProperties((prev: Property[]) => [...prev, newProperty]);
        toast.success('Imóvel cadastrado com sucesso!');
      }
      handleCancelEdit();
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      if (error instanceof Error) {
        toast.error(`Erro ao salvar imóvel: ${error.message}`);
      } else {
        toast.error('Erro ao salvar imóvel. Por favor, tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProperty({
      title: '',
      description: '',
      price: 0,
      location: '',
      type: 'sale',
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      images: [],
      coverPhotoIndex: 0,
      features: {
        has_pool: false,
        has_garden: false,
        has_garage: false,
        has_security_system: false,
        has_air_conditioning: false,
        has_premium_appliances: false
      },
      isFeatured: false
    });
    setBrokerPhone('');
    setBrokerEmail('');
    setShowModal(false);
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    try {
      const imageUrl = property.images?.[indexToRemove];
      if (imageUrl) {
        await deleteImage(imageUrl);
        // Ajusta o índice da capa se necessário
        if (indexToRemove === coverPhotoIndex) {
          setCoverPhotoIndex(0);
        } else if (indexToRemove < coverPhotoIndex) {
          setCoverPhotoIndex(prev => prev - 1);
        }
        setProperty((prev: Partial<Property>) => ({
          ...prev,
          images: prev.images?.filter((_: string, index: number) => index !== indexToRemove) || []
        }));
        toast.success('Imagem removida com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    const foundProperty = properties.find((p: Property) => p.id === propertyId);
    if (foundProperty) {
      setPropertyToDelete(foundProperty); // Armazena o imóvel a ser deletado
      setDeleteConfirmationModal(true); // Abre o modal de confirmação
    }
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete || !propertyToDelete.id) return;
    try {
      if (propertyToDelete?.images && propertyToDelete.images.length > 0) {
        // Filtra URLs vazias e depois executa o deleteImage
        const validUrls = propertyToDelete.images.filter(url => url && typeof url === 'string');
        if (validUrls.length > 0) {
          await Promise.all(validUrls.map(url => deleteImage(url)));
        }
      }
      await deleteProperty(propertyToDelete.id);
      setProperties((prev: Property[]) => prev.filter((p: Property) => p.id !== propertyToDelete.id));
      toast.success('Imóvel excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error);
      toast.error('Erro ao excluir imóvel');
    } finally {
      setDeleteConfirmationModal(false); // Fecha o modal de confirmação
      setPropertyToDelete(null); // Reseta o imóvel a ser deletado
    }
  };

  const cancelDeleteProperty = () => {
    setDeleteConfirmationModal(false); // Fecha o modal de confirmação
    setPropertyToDelete(null); // Reseta o imóvel a ser deletado
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {userRole === 'admin' ? 'Painel Administrativo' : 'Meus Imóveis'}
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Imóvel
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </button>
        </div>
      </div>
      {/* Property List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Gerenciar Imóveis</h2>
        {properties.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhum imóvel cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {properties.map((prop: Property) => (
              <div key={prop.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  {prop.images && prop.images[0] && (
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{prop.title}</h3>
                    <p className="text-gray-600">{prop.location}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-blue-600 font-semibold">
                        {prop.price === 0 && prop.type === 'rent' ? 'A consultar!' : `R$ ${formatCurrency(prop.price)}${prop.type === 'rent' ? '/mês' : ''}`}
                      </p>
                      {prop.isFeatured && (
                        <span className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 mr-1" />
                          Destacado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {prop.features?.has_pool && <FaSwimmingPool className="w-4 h-4 text-blue-600" />}
                      {prop.features?.has_garden && <Tree className="w-4 h-4 text-blue-600" />}
                      {prop.features?.has_garage && <Car className="w-4 h-4 text-blue-600" />}
                      {prop.features?.has_security_system && <Shield className="w-4 h-4 text-blue-600" />}
                      {prop.features?.has_air_conditioning && <Wind className="w-4 h-4 text-blue-600" />}
                      {prop.features?.has_premium_appliances && <Refrigerator className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleEdit(prop)}
                    className="text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteProperty(prop.id!)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="Título do Imóvel"
                    value={property.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Anúncio
                  </label>
                  <select
                    name="type"
                    value={property.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sale">Para Venda</option>
                    <option value="rent">Para Alugar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço {property.type === 'rent' ? '(mensal)' : ''}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="text"
                      name="price"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                      placeholder={property.type === 'rent' ? 'Valor do Aluguel' : 'Valor do Imóvel'}
                      value={formatCurrency(property.price || 0)}
                      onChange={handlePriceChange}
                      required
                    />
                  </div>
                  {property.type === 'rent' && property.price === 0 && (
                    <p className="text-gray-600 mt-1">
                      Deixe 0 se o valor for negociável. No anúncio, será exibido "A consultar!"
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap"
                  rows={4}
                  placeholder="Descrição do Imóvel"
                  value={property.description}
                  onChange={handleInputChange}
                  required
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quartos
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de Quartos"
                    min="0"
                    value={property.bedrooms}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banheiros
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de Banheiros"
                    min="0"
                    value={property.bathrooms}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área (m²)
                  </label>
                  <input
                    type="number"
                    name="area"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="Metros Quadrados"
                    min="0"
                    value={property.area}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização
                </label>
                <input
                  type="text"
                  name="location"
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  placeholder="Endereço do Imóvel"
                  value={property.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Características
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_pool}
                      onChange={() => handleFeatureChange('has_pool')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <FaSwimmingPool className="w-5 h-5 text-blue-600" />
                    <span>Piscina</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_garden}
                      onChange={() => handleFeatureChange('has_garden')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Tree className="w-5 h-5 text-blue-600" />
                    <span>Jardim</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_garage}
                      onChange={() => handleFeatureChange('has_garage')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Car className="w-5 h-5 text-blue-600" />
                    <span>Garagem</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_security_system}
                      onChange={() => handleFeatureChange('has_security_system')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>Sistema de Segurança</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_air_conditioning}
                      onChange={() => handleFeatureChange('has_air_conditioning')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Wind className="w-5 h-5 text-blue-600" />
                    <span>Ar Condicionado Central</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_premium_appliances}
                      onChange={() => handleFeatureChange('has_premium_appliances')}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Refrigerator className="w-5 h-5 text-blue-600" />
                    <span>Eletrodomésticos de Alto Padrão</span>
                  </label>
                </div>
              </div>
              {/* Broker Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline-block mr-2" />
                    Telefone do Corretor
                  </label>
                  <input
                    type="tel"
                    name="brokerPhone"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 00000-0000"
                    value={brokerPhone}
                    onChange={handleBrokerContactChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline-block mr-2" />
                    Email do Corretor
                  </label>
                  <input
                    type="email"
                    name="brokerEmail"
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
                    placeholder="corretor@exemplo.com"
                    value={brokerEmail}
                    onChange={handleBrokerContactChange}
                  />
                </div>
              </div>
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagens
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} disabled={isUploading} />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-600">Enviando imagens...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">
                        Arraste e solte as imagens aqui, ou clique para selecionar
                      </p>
                    </>
                  )}
                </div>
                {property.images && property.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {property.images.map((image: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCoverPhotoIndex(index);
                            }}
                            className={`p-1 rounded-full transition-all ${
                              index === coverPhotoIndex
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/80 text-gray-700 hover:bg-blue-600 hover:text-white'
                            }`}
                            title={index === coverPhotoIndex ? 'Foto de capa' : 'Definir como capa'}
                          >
                            <Image className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Featured Property Option (Admin Only) */}
              {userRole === 'admin' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={property.isFeatured}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProperty((prev: Partial<Property>) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isFeatured" className="flex items-center text-sm font-medium text-gray-700">
                    <Star className="w-4 h-4 text-yellow-400 mr-2" />
                    Destacar este imóvel na página inicial
                  </label>
                </div>
              )}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center ${
                    (isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    isEditing ? 'Atualizar Imóvel' : 'Salvar Imóvel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmationModal && propertyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tem certeza que deseja excluir este imóvel?
              </h2>
              <p className="text-gray-600 mb-6">
                Esta ação não pode ser desfeita. Todos os dados associados a este imóvel serão perdidos.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={cancelDeleteProperty}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteProperty}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;