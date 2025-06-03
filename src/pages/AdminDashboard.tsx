import React, { useCallback, useState, useEffect, FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Plus, Trash2, X, Star, LogOut, Trees as Tree, Car, Shield, Wind, Refrigerator, Phone, Mail, Image, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { FaSwimmingPool } from "react-icons/fa";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { Property, PropertyFeatures } from '../types/property';
import { createProperty, updateProperty, getProperties, deleteProperty } from '../services';
import { supabase, uploadImage, deleteImage, signOut, getUserRole } from '../lib/supabase';
import { CORSStatus } from '../components/CORSStatus';
import { RateLimitStatus } from '../guards';
import { useBotDetectionForAdmin } from '../hooks/useBotDetection';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false); // Estado para o modal de confirmação de exclusão
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null); // Armazena o imóvel a ser deletado
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

  // Detecção de bots para área administrativa
  const {
    isBot,
    confidence,
    isHumanBehavior
  } = useBotDetectionForAdmin();

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
    console.log('🚀 onDrop iniciado:', {
      filesCount: acceptedFiles.length,
      currentImagesCount: property.images?.length || 0,
      files: acceptedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    });

    try {
      // VERIFICAR AUTENTICAÇÃO ANTES DO UPLOAD
      console.log('🔐 Verificando autenticação antes do upload...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro ao verificar sessão:', sessionError);
        toast.error('Erro ao verificar autenticação');
        return;
      }
      
      if (!session) {
        console.error('❌ Usuário não autenticado');
        toast.error('Por favor, faça login para continuar');
        navigate('/login');
        return;
      }
      
      console.log('✅ Usuário autenticado:', {
        email: session.user.email,
        role: session.user.user_metadata?.role || 'standard'
      });

      // Verifica se já tem mais de 12 imagens
      if ((property.images?.length || 0) + acceptedFiles.length > 12) {
        console.log('❌ Limite de imagens excedido');
        toast.error('Você pode fazer o upload de no máximo 12 imagens.');
        return;
      }

      console.log('📤 Iniciando uploads...');
      setIsUploading(true);
      
      const currentImages = property.images || [];
      const filesToUpload = acceptedFiles.slice(0, 12 - currentImages.length);
      
      console.log('📋 Arquivos para upload:', filesToUpload.length);

      // Upload um por vez para melhor debug
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        console.log(`📸 Uploading arquivo ${i + 1}/${filesToUpload.length}:`, file.name);
        
        try {
          const url = await uploadImage(file);
          console.log(`✅ Upload ${i + 1} concluído:`, url);
          uploadedUrls.push(url);
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Erro desconhecido';
          console.error(`❌ Erro no upload ${i + 1}:`, {
            fileName: file.name,
            error: uploadError,
            message: errorMessage
          });
          throw uploadError; // Re-throw para parar o processo
        }
      }

      console.log('🎉 Todos os uploads concluídos:', uploadedUrls);

      setProperty((prev: Partial<Property>) => ({
        ...prev,
        images: [...currentImages, ...uploadedUrls]
      }));

      // Se for a primeira imagem, define automaticamente como capa
      if (currentImages.length === 0) {
        console.log('📌 Definindo primeira imagem como capa');
        setCoverPhotoIndex(0);
      }

      toast.success(`${uploadedUrls.length} imagem(ns) enviada(s) com sucesso!`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('💥 Erro geral no onDrop:', {
        error,
        message: errorMessage,
        type: typeof error
      });
      
      toast.error(`Erro ao fazer upload das imagens: ${errorMessage}`);
    } finally {
      console.log('🏁 onDrop finalizado');
      setIsUploading(false);
    }
  }, [property.images, navigate]);

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
        coverPhotoIndex: property.coverPhotoIndex || 0,
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
        // Importante para garantir que as alterações sejam refletidas na interface
        setProperties((prev: Property[]) => prev.map((p: Property) => 
          p.id === property.id ? { 
            ...p, 
            ...propertyData,
            // Garantir que as características sejam atualizadas corretamente
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

  const handleEdit = (propertyToEdit: Property) => {
    setIsEditing(true);
    setProperty(propertyToEdit);
    setCoverPhotoIndex(propertyToEdit.coverPhotoIndex || 0);
    setBrokerPhone(propertyToEdit.brokerPhone || '');
    setBrokerEmail(propertyToEdit.brokerEmail || '');
    setShowModal(true);
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
      if (!imageUrl) {
        console.warn('URL da imagem não encontrada para o índice:', indexToRemove);
        return;
      }

      // Remove a imagem do storage
      await deleteImage(imageUrl);
      
      // Atualiza o array de imagens
      const newImages = property.images?.filter((_: string, index: number) => index !== indexToRemove) || [];
      
      // Ajusta o índice da capa de forma mais robusta
      let newCoverIndex = coverPhotoIndex;
      
      if (indexToRemove === coverPhotoIndex) {
        // Se removeu a foto de capa, define a primeira imagem restante como capa
        newCoverIndex = 0;
      } else if (indexToRemove < coverPhotoIndex) {
        // Se removeu uma imagem antes da capa, decrementa o índice da capa
        newCoverIndex = coverPhotoIndex - 1;
      }
      
      // Garante que o índice não seja negativo ou maior que o array
      if (newImages.length === 0) {
        newCoverIndex = 0;
      } else if (newCoverIndex >= newImages.length) {
        newCoverIndex = newImages.length - 1;
      }
      
      // Atualiza o estado
      setCoverPhotoIndex(newCoverIndex);
      setProperty((prev: Partial<Property>) => ({
        ...prev,
        images: newImages,
        coverPhotoIndex: newCoverIndex
      }));
      
      toast.success('Imagem removida com sucesso!');
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
    <div className="space-y-4 md:space-y-8 px-4 md:px-0">
      {/* Header responsivo */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Painel Administrativo' : 'Meus Imóveis'}
          </h1>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 lg:space-x-4">
          {userRole === 'admin' && (
            <Link
              to="/admin/users"
              className="bg-gray-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center text-sm md:text-base"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Usuários
            </Link>
          )}
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Adicionar Imóvel
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-red-700 flex items-center justify-center text-sm md:text-base"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Sair
          </button>
        </div>
      </div>
      
      {/* Property List - Melhor responsividade */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Gerenciar Imóveis</h2>
        {properties.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhum imóvel cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {properties.map((prop: Property) => (
              <div key={prop.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                  {prop.images && prop.images.length > 0 && (
                    <img
                      src={prop.images[prop.coverPhotoIndex || 0] || prop.images[0]}
                      alt={prop.title}
                      className="w-full sm:w-20 h-48 sm:h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base md:text-lg truncate">{prop.title}</h3>
                    <p className="text-gray-600 text-sm md:text-base truncate">{prop.location}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                      <p className="text-blue-600 font-semibold text-sm md:text-base">
                        {prop.price === 0 && prop.type === 'rent' ? 'A consultar!' : `R$ ${formatCurrency(prop.price)}${prop.type === 'rent' ? '/mês' : ''}`}
                      </p>
                      {prop.isFeatured && (
                        <span className="flex items-center text-yellow-500 text-sm">
                          <Star className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Destacado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
                      {prop.features?.has_pool && <FaSwimmingPool className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                      {prop.features?.has_garden && <Tree className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                      {prop.features?.has_garage && <Car className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                      {prop.features?.has_security_system && <Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                      {prop.features?.has_air_conditioning && <Wind className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                      {prop.features?.has_premium_appliances && <Refrigerator className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col lg:flex-row space-x-2 sm:space-x-0 sm:space-y-2 lg:space-y-0 lg:space-x-4 justify-end sm:justify-center lg:justify-end">
                  <button 
                    onClick={() => handleEdit(prop)}
                    className="text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 text-sm md:text-base flex-1 sm:flex-none"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteProperty(prop.id!)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-lg hover:bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Property Modal - Melhor responsividade */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-2 md:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold">
                {isEditing ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Campos básicos - Grid responsivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm md:text-base">R$</span>
                    <input
                      type="text"
                      name="price"
                      className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      placeholder={property.type === 'rent' ? 'Valor do Aluguel' : 'Valor do Imóvel'}
                      value={formatCurrency(property.price || 0)}
                      onChange={handlePriceChange}
                      required
                    />
                  </div>
                  {property.type === 'rent' && property.price === 0 && (
                    <p className="text-gray-600 mt-1 text-xs md:text-sm">
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
                  className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap text-sm md:text-base"
                  rows={4}
                  placeholder="Descrição do Imóvel"
                  value={property.description}
                  onChange={handleInputChange}
                  required
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
              
              {/* Campos de números - Grid responsivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quartos
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  placeholder="Endereço do Imóvel"
                  value={property.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {/* Características - Grid responsivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Características
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_pool}
                      onChange={() => handleFeatureChange('has_pool')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <FaSwimmingPool className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="text-sm md:text-base">Piscina</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_garden}
                      onChange={() => handleFeatureChange('has_garden')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Tree className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="text-sm md:text-base">Jardim</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_garage}
                      onChange={() => handleFeatureChange('has_garage')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Car className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="text-sm md:text-base">Garagem</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_security_system}
                      onChange={() => handleFeatureChange('has_security_system')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="text-sm md:text-base">Sistema de Segurança</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_air_conditioning}
                      onChange={() => handleFeatureChange('has_air_conditioning')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Wind className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="text-sm md:text-base">Ar Condicionado Central</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={property.features?.has_premium_appliances}
                      onChange={() => handleFeatureChange('has_premium_appliances')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Refrigerator className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="text-sm md:text-base">Eletrodomésticos de Alto Padrão</span>
                  </label>
                </div>
              </div>
              
              {/* Broker Contact Information - Grid responsivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-3 h-3 md:w-4 md:h-4 inline-block mr-2" />
                    Telefone do Corretor
                  </label>
                  <input
                    type="tel"
                    name="brokerPhone"
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="(00) 00000-0000"
                    value={brokerPhone}
                    onChange={handleBrokerContactChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-3 h-3 md:w-4 md:h-4 inline-block mr-2" />
                    Email do Corretor
                  </label>
                  <input
                    type="email"
                    name="brokerEmail"
                    className="w-full px-3 md:px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
                  className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center cursor-pointer ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} disabled={isUploading} />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-6 w-6 md:h-8 md:w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-600 text-sm md:text-base">Enviando imagens...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 md:w-12 md:h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 text-sm md:text-base">
                        Arraste e solte as imagens aqui, ou clique para selecionar
                      </p>
                    </>
                  )}
                </div>
                {property.images && property.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {property.images.map((image: string, index: number) => {
                      if (!image || typeof image !== 'string') {
                        console.warn('Imagem inválida no índice:', index);
                        return null;
                      }
                      
                      return (
                        <div key={`${image}-${index}`} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 md:h-24 object-cover rounded-lg"
                            onError={(e) => {
                              console.error('Erro ao carregar imagem:', image);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-1 md:top-2 left-1 md:left-2 flex gap-1 md:gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  setCoverPhotoIndex(index);
                                  setProperty((prev: Partial<Property>) => ({
                                    ...prev,
                                    coverPhotoIndex: index
                                  }));
                                } catch (error) {
                                  console.error('Erro ao definir foto de capa:', error);
                                }
                              }}
                              className={`p-1 rounded-full transition-all ${
                                index === coverPhotoIndex
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white/80 text-gray-700 hover:bg-blue-600 hover:text-white'
                              }`}
                              title={index === coverPhotoIndex ? 'Foto de capa' : 'Definir como capa'}
                            >
                              <Image className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                handleRemoveImage(index);
                              } catch (error) {
                                console.error('Erro ao remover imagem:', error);
                              }
                            }}
                            className="absolute top-1 md:top-2 right-1 md:right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                      );
                    })}
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
                    onChange={(e) => setProperty((prev: Partial<Property>) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isFeatured" className="flex items-center text-sm font-medium text-gray-700">
                    <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 mr-2" />
                    Destacar este imóvel na página inicial
                  </label>
                </div>
              )}
              
              {/* Botões - Layout responsivo */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 md:gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 text-sm md:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className={`w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm md:text-base ${
                    (isSubmitting || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Tem certeza que deseja excluir este imóvel?
              </h2>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Esta ação não pode ser desfeita. Todos os dados associados a este imóvel serão perdidos.
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 md:gap-4">
                <button
                  onClick={cancelDeleteProperty}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 text-sm md:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteProperty}
                  className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 text-sm md:text-base"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Security Status - Grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <CORSStatus />
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <RateLimitStatus action={`route_access_${location.pathname.replace(/\//g, '_')}`} />
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                Detecção de Bots
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isBot ? (
                    <>
                      <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                      <span className="text-red-600 text-xs md:text-sm">Bot Detectado ({confidence}%)</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                      <span className="text-green-600 text-xs md:text-sm">Usuário Legítimo</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isHumanBehavior ? (
                    <>
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                      <span className="text-blue-600 text-xs md:text-sm">Comportamento Humano</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-yellow-600" />
                      <span className="text-yellow-600 text-xs md:text-sm">Aguardando Interação</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;