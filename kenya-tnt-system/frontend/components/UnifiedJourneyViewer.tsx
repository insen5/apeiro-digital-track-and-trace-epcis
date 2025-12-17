import React from "react";

// JourneyStep interface
export interface JourneyStep {
  title: string;
  location: string;
  date: string;
  status: string;
  details?: Record<string, unknown>;
  carrier?: string;
  customer?: string;
  ssccBarcode?: string;
  parentssccBarcode?: string;
  // Product Details
  productName?: string;
  productBrand?: string;
  productGtin?: string;
  productId?: number;
  productUserId?: string;
  productIsEnabled?: boolean;
  productCreatedAt?: string;
  productUpdatedAt?: string;
  // Batch Details
  batchNumber?: string;
  batchId?: number;
  expiryDate?: string;
  quantity?: number;
  batchQty?: string;
  sentQty?: string;
  receivedFrom?: string;
  permitId?: string;
  consignmentRef?: string;
  batchIsEnabled?: boolean;
  batchUserId?: string;
  batchCreatedAt?: string;
  batchUpdatedAt?: string;
  batchSsccBarcode?: string;
  // Shipment Details
  destinationAddress?: string;
  pickupLocation?: string;
  expectedDeliveryDate?: string;
  eventTime?: string;
  eventStatus?: string;
  // GLN & Company Details
  manufacturerCompany?: string;
  manufacturerGln?: string;
  customerCompany?: string;
  customerGln?: string;
  customerEmail?: string;
  // Additional
  serializationCount?: number;
  shipmentId?: number;
  // Return Details
  returnType?: string;
  returnMessage?: string;
}

interface UnifiedJourneyData {
  epc?: string;
  serial?: string | { code?: string };
  sscc?: string;
  manufacturer?: {
    shipping?: Array<Record<string, unknown>>;
    receiving?: Array<Record<string, unknown>>;
    returns?: Array<Record<string, unknown>>;
  };
  supplier?: {
    shipping?: Array<Record<string, unknown>>;
    receiving?: Array<Record<string, unknown>>;
    returns?: Array<Record<string, unknown>>;
  };
  userFacility?: {
    shipping?: Array<Record<string, unknown>>;
    receiving?: Array<Record<string, unknown>>;
    returns?: Array<Record<string, unknown>>;
  };
  journeySteps?: JourneyStep[];
}

interface UnifiedJourneyViewerProps {
  data: UnifiedJourneyData;
  className?: string;
}

// Journey Step Item Component (internal)
interface JourneyStepItemProps {
  step: JourneyStep;
  index: number;
}

const JourneyStepItem: React.FC<JourneyStepItemProps> = ({ step, index }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string, isReturn?: boolean) => {
    if (isReturn) {
      return "bg-orange-500";
    }
    switch (status) {
      case "completed":
        return "bg-sky-500";
      case "in-progress":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  const getIcon = (title: string) => {
    if (title.includes("Return")) return "↩️";
    if (title.includes("Manufacturer")) return "🏭";
    if (title.includes("Supplier")) return "📦";
    return "🏥";
  };

  const product = step.details?.product as Record<string, unknown> | undefined;
  const batch = step.details?.batch as Record<string, unknown> | undefined;

  return (
    <div key={`step-${index}`} className="relative flex items-start mb-8">
      <div
        className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${getStatusColor(
          step.status,
          Boolean(step.returnType)
        )} text-white text-2xl shadow-lg`}
      >
        {getIcon(step.title)}
      </div>

      <div className="ml-6 flex-1">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {step.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                step.status,
                Boolean(step.returnType)
              )}`}
            >
              {step.returnType ? "Return" : getStatusText(step.status)}
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3">
            {step.location} - {formatDate(step.date)}
          </p>

          {/* Important Details - Simplified */}
          <div className="space-y-3">
            {/* Shipment Info */}
            {(step.carrier || step.customer || step.ssccBarcode) && (
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {step.carrier && (
                    <div>
                      <span className="text-gray-600">Carrier:</span>
                      <span className="ml-2 font-medium">{step.carrier}</span>
                    </div>
                  )}
                  {step.customer && (
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-2 font-medium">{step.customer}</span>
                    </div>
                  )}
                  {step.ssccBarcode && (
                    <div className="col-span-2">
                      <span className="text-gray-600">SSCC:</span>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {String(step.ssccBarcode)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Return Info */}
            {(step.returnType || step.returnMessage) && (
              <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">
                  Return Information
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {step.returnType && (
                    <div>
                      <span className="text-gray-600">Return Type:</span>
                      <span className="ml-2 font-medium text-orange-700">
                        {String(step.returnType)}
                      </span>
                    </div>
                  )}
                  {step.returnMessage && (
                    <div>
                      <span className="text-gray-600">Return Message:</span>
                      <span className="ml-2 font-medium">
                        {String(step.returnMessage)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Info */}
            {(() => {
              const hasProduct = Boolean(step.productName) || Boolean(product);
              return hasProduct;
            })() && (
              <div className="bg-white p-3 rounded border-l-4 border-sky-500">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Boolean(step.productName || product?.name) && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Product:</span>
                      <span className="ml-2 font-medium">
                        {String(step.productName || product?.name || "")}
                      </span>
                    </div>
                  )}
                  {Boolean(step.productBrand || product?.brand) && (
                    <div>
                      <span className="text-gray-600">Brand:</span>
                      <span className="ml-2 font-medium">
                        {String(step.productBrand || product?.brand || "")}
                      </span>
                    </div>
                  )}
                  {Boolean(step.productGtin || product?.gtin) && (
                    <div>
                      <span className="text-gray-600">GTIN:</span>
                      <span className="ml-2 font-mono text-xs">
                        {String(step.productGtin || product?.gtin || "")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Batch Info */}
            {(() => {
              const hasBatch = Boolean(step.batchNumber) || Boolean(batch);
              return hasBatch;
            })() && (
              <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Boolean(step.batchNumber || batch?.number) && (
                    <div>
                      <span className="text-gray-600">Batch:</span>
                      <span className="ml-2 font-medium">
                        {String(step.batchNumber || batch?.number || "")}
                      </span>
                    </div>
                  )}
                  {Boolean(step.expiryDate || batch?.expiry) && (
                    <div>
                      <span className="text-gray-600">Expiry:</span>
                      <span className="ml-2 font-medium">
                        {formatDate(
                          String(step.expiryDate || batch?.expiry || "")
                        )}
                      </span>
                    </div>
                  )}
                  {Boolean(step.quantity || batch?.qty) && (
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="ml-2 font-medium">
                        {String(step.quantity || batch?.qty || "")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Patient Info - for Facility Dispensing */}
            {(() => {
              const patient = step.details?.patient as
                | Record<string, unknown>
                | undefined;
              const hasPatient =
                patient &&
                (Boolean(patient.name) ||
                  Boolean(patient.county) ||
                  Boolean(patient.gender) ||
                  Boolean(patient.yearOfBirth));
              return hasPatient;
            })() && (
              <div className="bg-white p-3 rounded border-l-4 border-pink-500">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">
                  Patient Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(() => {
                    const patient = step.details?.patient as
                      | Record<string, unknown>
                      | undefined;
                    return (
                      <>
                        {patient && Boolean(patient.name) && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">
                              {String(patient.name)}
                            </span>
                          </div>
                        )}
                        {patient && Boolean(patient.county) && (
                          <div>
                            <span className="text-gray-600">County:</span>
                            <span className="ml-2 font-medium">
                              {String(patient.county)}
                            </span>
                          </div>
                        )}
                        {patient && Boolean(patient.gender) && (
                          <div>
                            <span className="text-gray-600">Gender:</span>
                            <span className="ml-2 font-medium">
                              {String(patient.gender)}
                            </span>
                          </div>
                        )}
                        {patient && Boolean(patient.yearOfBirth) && (
                          <div>
                            <span className="text-gray-600">
                              Year of Birth:
                            </span>
                            <span className="ml-2 font-medium">
                              {String(patient.yearOfBirth)}
                            </span>
                          </div>
                        )}
                        {patient && Boolean(patient.encryptedPatientId) && (
                          <div>
                            <span className="text-gray-600">Patient ID:</span>
                            <span className="ml-2 font-mono text-xs">
                              {String(patient.encryptedPatientId)}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to extract key information from a shipment
const extractKeyInfo = (shipment: Record<string, unknown>) => {
  const userId = shipment.userId as Record<string, unknown> | undefined;
  const customerId = shipment.customerId as Record<string, unknown> | undefined;
  const glnReference = userId?.glnReference as
    | Record<string, unknown>
    | undefined;
  const customerGln = customerId?.glnReference as
    | Record<string, unknown>
    | undefined;
  const epcisEvent = shipment.epcisEvent as Record<string, unknown> | undefined;

  const firstLine = (shipment.lines as Array<Record<string, unknown>>)?.[0];
  const batch = firstLine?.batch as Record<string, unknown> | undefined;
  const productId = firstLine?.productId as Record<string, unknown> | undefined;
  const serializations = firstLine?.serializations as
    | Array<Record<string, unknown>>
    | undefined;

  return {
    manufacturerCompany: glnReference?.company as string | undefined,
    manufacturerLocation: glnReference?.location as string | undefined,
    manufacturerGln: glnReference?.fullGln as string | undefined,
    customerName: shipment.customer as string | undefined,
    customerEmail: customerId?.email as string | undefined,
    customerCompany: customerGln?.company as string | undefined,
    customerGln: customerGln?.fullGln as string | undefined,
    // Product Details
    productName: productId?.productName as string | undefined,
    productBrand: productId?.brandName as string | undefined,
    productGtin: productId?.gtin as string | undefined,
    productId: productId?.id as number | undefined,
    productUserId: productId?.userId as string | undefined,
    productIsEnabled: productId?.isEnabled as boolean | undefined,
    productCreatedAt: productId?.createdAt as string | undefined,
    productUpdatedAt: productId?.updatedAt as string | undefined,
    // Batch Details
    batchNumber: batch?.batchno as string | undefined,
    batchId: batch?.id as number | undefined,
    expiryDate: batch?.expiry as string | undefined,
    quantity: firstLine?.qty as number | undefined,
    batchQty: batch?.qty as string | undefined,
    sentQty: batch?.sentQty as string | undefined,
    receivedFrom: batch?.receivedFrom as string | undefined,
    permitId: batch?.permitid as string | undefined,
    consignmentRef: batch?.consignmentrefnumber as string | undefined,
    batchIsEnabled: batch?.isEnabled as boolean | undefined,
    batchUserId: batch?.userId as string | undefined,
    batchCreatedAt: batch?.createdAt as string | undefined,
    batchUpdatedAt: batch?.updatedAt as string | undefined,
    batchSsccBarcode: batch?.ssccBarcode as string | undefined,
    // Shipment Details
    destinationAddress: shipment.destinationaddress as string | undefined,
    pickupLocation: shipment.pickuplocation as string | undefined,
    expectedDeliveryDate: shipment.expectedDeliveryDate as string | undefined,
    eventTime: epcisEvent?.eventTime as string | undefined,
    eventStatus: epcisEvent?.status as string | undefined,
    // Additional
    serializationCount: serializations?.length,
    shipmentId: shipment.id as number | undefined,
  };
};

// Helper function to extract facility info (for user facility shipments)
const extractFacilityInfo = (shipment: Record<string, unknown>) => {
  const userId = shipment.userId as Record<string, unknown> | undefined;
  const glnReference = userId?.glnReference as
    | Record<string, unknown>
    | undefined;
  const epcisEvent = shipment.epcisEvent as Record<string, unknown> | undefined;

  const firstProduct = (
    shipment.shipmentproducts as Array<Record<string, unknown>>
  )?.[0];
  const productId = firstProduct?.productId as
    | Record<string, unknown>
    | undefined;
  const serializations = firstProduct?.serializations as
    | Array<Record<string, unknown>>
    | undefined;

  return {
    manufacturerCompany: glnReference?.company as string | undefined,
    manufacturerLocation: glnReference?.location as string | undefined,
    manufacturerGln: glnReference?.fullGln as string | undefined,
    customerName: shipment.name as string | undefined,
    customerEmail: undefined,
    customerCompany: undefined,
    customerGln: undefined,
    // Product Details
    productName: productId?.productName as string | undefined,
    productBrand: productId?.brandName as string | undefined,
    productGtin: productId?.gtin as string | undefined,
    productId: productId?.id as number | undefined,
    productUserId: productId?.userId as string | undefined,
    productIsEnabled: productId?.isEnabled as boolean | undefined,
    productCreatedAt: productId?.createdAt as string | undefined,
    productUpdatedAt: productId?.updatedAt as string | undefined,
    // Batch Details
    batchNumber: undefined,
    batchId: undefined,
    expiryDate: undefined,
    quantity: firstProduct?.qty as number | undefined,
    batchQty: undefined,
    sentQty: undefined,
    receivedFrom: undefined,
    permitId: undefined,
    consignmentRef: undefined,
    batchIsEnabled: undefined,
    batchUserId: undefined,
    batchCreatedAt: undefined,
    batchUpdatedAt: undefined,
    batchSsccBarcode: undefined,
    // Shipment Details
    destinationAddress: shipment.destinationaddress as string | undefined,
    pickupLocation: shipment.pickuplocation as string | undefined,
    expectedDeliveryDate: shipment.expectedDeliveryDate as string | undefined,
    eventTime: epcisEvent?.eventTime as string | undefined,
    eventStatus: epcisEvent?.status as string | undefined,
    // Additional
    serializationCount: serializations?.length,
    shipmentId: shipment.id as number | undefined,
  };
};

// Build journey steps from the unified API structure
const buildJourneySteps = (data: UnifiedJourneyData): JourneyStep[] => {
  const journeySteps: JourneyStep[] = [];

  // Manufacturer shipping steps - FIRST
  const manufacturerShipping = data.manufacturer?.shipping;
  if (manufacturerShipping && manufacturerShipping.length > 0) {
    manufacturerShipping.forEach((shipment) => {
      const info = extractKeyInfo(shipment);
      journeySteps.push({
        title: "Manufacturer Shipped",
        location:
          info.pickupLocation ||
          info.manufacturerLocation ||
          "Manufacturing Facility",
        date: (shipment.pickupDate as string) || "",
        status: shipment.isDispatched ? "completed" : "in-progress",
        carrier: shipment.carrier as string,
        customer:
          info.customerName ||
          info.customerCompany ||
          (shipment.customer as string) ||
          "",
        ssccBarcode: shipment.ssccBarcode as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        batchNumber: info.batchNumber,
        batchId: info.batchId,
        expiryDate: info.expiryDate,
        quantity: info.quantity,
        batchQty: info.batchQty,
        sentQty: info.sentQty,
        receivedFrom: info.receivedFrom,
        permitId: info.permitId,
        consignmentRef: info.consignmentRef,
        batchIsEnabled: info.batchIsEnabled,
        batchUserId: info.batchUserId,
        batchCreatedAt: info.batchCreatedAt,
        batchUpdatedAt: info.batchUpdatedAt,
        batchSsccBarcode: info.batchSsccBarcode,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        customerCompany: info.customerCompany,
        customerGln: info.customerGln,
        customerEmail: info.customerEmail,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName || info.customerCompany,
          customerGln: info.customerGln,
          customerEmail: info.customerEmail,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          batch: {
            number: info.batchNumber,
            id: info.batchId,
            expiry: info.expiryDate,
            qty: info.batchQty,
            sentQty: info.sentQty,
            receivedFrom: info.receivedFrom,
            permitId: info.permitId,
            consignmentRef: info.consignmentRef,
            isEnabled: info.batchIsEnabled,
            userId: info.batchUserId,
            createdAt: info.batchCreatedAt,
            updatedAt: info.batchUpdatedAt,
            ssccBarcode: info.batchSsccBarcode,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
        },
      });
    });
  }

  // Manufacturer returns steps
  const manufacturerReturns = data.manufacturer?.returns;
  if (manufacturerReturns && manufacturerReturns.length > 0) {
    manufacturerReturns.forEach((shipment) => {
      const info = extractKeyInfo(shipment);
      journeySteps.push({
        title: "Manufacturer Return Received",
        location:
          info.pickupLocation ||
          info.manufacturerLocation ||
          "Manufacturing Facility",
        date: (shipment.pickupDate as string) || "",
        status: shipment.isDispatched ? "completed" : "in-progress",
        carrier: shipment.carrier as string,
        customer:
          info.customerName ||
          info.customerCompany ||
          (shipment.customer as string) ||
          "",
        ssccBarcode: shipment.ssccBarcode as string,
        parentssccBarcode: shipment.parentssccBarcode as string,
        returnType: shipment.returnType as string,
        returnMessage: shipment.returnMessage as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        batchNumber: info.batchNumber,
        batchId: info.batchId,
        expiryDate: info.expiryDate,
        quantity: info.quantity,
        batchQty: info.batchQty,
        sentQty: info.sentQty,
        receivedFrom: info.receivedFrom,
        permitId: info.permitId,
        consignmentRef: info.consignmentRef,
        batchIsEnabled: info.batchIsEnabled,
        batchUserId: info.batchUserId,
        batchCreatedAt: info.batchCreatedAt,
        batchUpdatedAt: info.batchUpdatedAt,
        batchSsccBarcode: info.batchSsccBarcode,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        customerCompany: info.customerCompany,
        customerGln: info.customerGln,
        customerEmail: info.customerEmail,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName || info.customerCompany,
          customerGln: info.customerGln,
          customerEmail: info.customerEmail,
          returnType: shipment.returnType,
          returnMessage: shipment.returnMessage,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          batch: {
            number: info.batchNumber,
            id: info.batchId,
            expiry: info.expiryDate,
            qty: info.batchQty,
            sentQty: info.sentQty,
            receivedFrom: info.receivedFrom,
            permitId: info.permitId,
            consignmentRef: info.consignmentRef,
            isEnabled: info.batchIsEnabled,
            userId: info.batchUserId,
            createdAt: info.batchCreatedAt,
            updatedAt: info.batchUpdatedAt,
            ssccBarcode: info.batchSsccBarcode,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
        },
      });
    });
  }

  // Supplier (CPA) receiving steps - SECOND
  const supplierReceiving = data.supplier?.receiving;
  if (supplierReceiving && supplierReceiving.length > 0) {
    supplierReceiving.forEach((shipment) => {
      const info = extractKeyInfo(shipment);
      journeySteps.push({
        title: "Supplier Received",
        location: info.pickupLocation || "Supplier Warehouse",
        date: (shipment.pickupDate as string) || "",
        status: "completed",
        carrier: shipment.carrier as string,
        customer:
          info.customerName ||
          info.customerCompany ||
          (shipment.customer as string) ||
          "",
        ssccBarcode: shipment.ssccBarcode as string,
        parentssccBarcode: shipment.parentssccBarcode as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        batchNumber: info.batchNumber,
        batchId: info.batchId,
        expiryDate: info.expiryDate,
        quantity: info.quantity,
        batchQty: info.batchQty,
        sentQty: info.sentQty,
        receivedFrom: info.receivedFrom,
        permitId: info.permitId,
        consignmentRef: info.consignmentRef,
        batchIsEnabled: info.batchIsEnabled,
        batchUserId: info.batchUserId,
        batchCreatedAt: info.batchCreatedAt,
        batchUpdatedAt: info.batchUpdatedAt,
        batchSsccBarcode: info.batchSsccBarcode,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        customerCompany: info.customerCompany,
        customerGln: info.customerGln,
        customerEmail: info.customerEmail,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName || info.customerCompany,
          customerGln: info.customerGln,
          customerEmail: info.customerEmail,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          batch: {
            number: info.batchNumber,
            id: info.batchId,
            expiry: info.expiryDate,
            qty: info.batchQty,
            sentQty: info.sentQty,
            receivedFrom: info.receivedFrom,
            permitId: info.permitId,
            consignmentRef: info.consignmentRef,
            isEnabled: info.batchIsEnabled,
            userId: info.batchUserId,
            createdAt: info.batchCreatedAt,
            updatedAt: info.batchUpdatedAt,
            ssccBarcode: info.batchSsccBarcode,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
        },
      });
    });
  }

  // Supplier (CPA) shipping steps - THIRD
  const supplierShipping = data.supplier?.shipping;
  if (supplierShipping && supplierShipping.length > 0) {
    supplierShipping.forEach((shipment) => {
      const info = extractKeyInfo(shipment);
      journeySteps.push({
        title: "Supplier Shipped",
        location: info.pickupLocation || "Supplier Warehouse",
        date: (shipment.pickupDate as string) || "",
        status: shipment.isDispatched ? "completed" : "in-progress",
        carrier: shipment.carrier as string,
        customer:
          info.customerName ||
          info.customerCompany ||
          (shipment.customer as string) ||
          "",
        ssccBarcode: shipment.ssccBarcode as string,
        parentssccBarcode: shipment.parentssccBarcode as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        batchNumber: info.batchNumber,
        batchId: info.batchId,
        expiryDate: info.expiryDate,
        quantity: info.quantity,
        batchQty: info.batchQty,
        sentQty: info.sentQty,
        receivedFrom: info.receivedFrom,
        permitId: info.permitId,
        consignmentRef: info.consignmentRef,
        batchIsEnabled: info.batchIsEnabled,
        batchUserId: info.batchUserId,
        batchCreatedAt: info.batchCreatedAt,
        batchUpdatedAt: info.batchUpdatedAt,
        batchSsccBarcode: info.batchSsccBarcode,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        customerCompany: info.customerCompany,
        customerGln: info.customerGln,
        customerEmail: info.customerEmail,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName || info.customerCompany,
          customerGln: info.customerGln,
          customerEmail: info.customerEmail,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          batch: {
            number: info.batchNumber,
            id: info.batchId,
            expiry: info.expiryDate,
            qty: info.batchQty,
            sentQty: info.sentQty,
            receivedFrom: info.receivedFrom,
            permitId: info.permitId,
            consignmentRef: info.consignmentRef,
            isEnabled: info.batchIsEnabled,
            userId: info.batchUserId,
            createdAt: info.batchCreatedAt,
            updatedAt: info.batchUpdatedAt,
            ssccBarcode: info.batchSsccBarcode,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
        },
      });
    });
  }

  // Supplier (CPA) returns steps
  const supplierReturns = data.supplier?.returns;
  if (supplierReturns && supplierReturns.length > 0) {
    supplierReturns.forEach((shipment) => {
      const info = extractKeyInfo(shipment);
      journeySteps.push({
        title: "Supplier Return Shipped",
        location: info.pickupLocation || "Supplier Warehouse",
        date: (shipment.pickupDate as string) || "",
        status: shipment.isDispatched ? "completed" : "in-progress",
        carrier: shipment.carrier as string,
        customer:
          info.customerName ||
          info.customerCompany ||
          (shipment.customer as string) ||
          "",
        ssccBarcode: shipment.ssccBarcode as string,
        parentssccBarcode: shipment.parentssccBarcode as string,
        returnType: shipment.returnType as string,
        returnMessage: shipment.returnMessage as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        batchNumber: info.batchNumber,
        batchId: info.batchId,
        expiryDate: info.expiryDate,
        quantity: info.quantity,
        batchQty: info.batchQty,
        sentQty: info.sentQty,
        receivedFrom: info.receivedFrom,
        permitId: info.permitId,
        consignmentRef: info.consignmentRef,
        batchIsEnabled: info.batchIsEnabled,
        batchUserId: info.batchUserId,
        batchCreatedAt: info.batchCreatedAt,
        batchUpdatedAt: info.batchUpdatedAt,
        batchSsccBarcode: info.batchSsccBarcode,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        customerCompany: info.customerCompany,
        customerGln: info.customerGln,
        customerEmail: info.customerEmail,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName || info.customerCompany,
          customerGln: info.customerGln,
          customerEmail: info.customerEmail,
          returnType: shipment.returnType,
          returnMessage: shipment.returnMessage,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          batch: {
            number: info.batchNumber,
            id: info.batchId,
            expiry: info.expiryDate,
            qty: info.batchQty,
            sentQty: info.sentQty,
            receivedFrom: info.receivedFrom,
            permitId: info.permitId,
            consignmentRef: info.consignmentRef,
            isEnabled: info.batchIsEnabled,
            userId: info.batchUserId,
            createdAt: info.batchCreatedAt,
            updatedAt: info.batchUpdatedAt,
            ssccBarcode: info.batchSsccBarcode,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
        },
      });
    });
  }

  // User Facility receiving steps - FOURTH
  const userFacilityReceiving = data.userFacility?.receiving;
  if (userFacilityReceiving && userFacilityReceiving.length > 0) {
    userFacilityReceiving.forEach((shipment) => {
      const info = extractFacilityInfo(shipment);
      journeySteps.push({
        title: "User Facility Received",
        location: info.pickupLocation || "User Facility",
        date: (shipment.pickupDate as string) || "",
        status: "completed",
        carrier: shipment.carrier as string,
        customer: info.customerName || "Patient",
        ssccBarcode: shipment.ssccBarcode as string,
        parentssccBarcode: shipment.parentssccBarcode as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        quantity: info.quantity,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
          patient: {
            name: shipment.name,
            county: shipment.county,
            gender: shipment.gender,
            yearOfBirth: shipment.yearOfBirth,
          },
        },
      });
    });
  }

  // User Facility shipping steps - FIFTH
  const userFacilityShipping = data.userFacility?.shipping;
  if (userFacilityShipping && userFacilityShipping.length > 0) {
    userFacilityShipping.forEach((shipment) => {
      const info = extractFacilityInfo(shipment);
      journeySteps.push({
        title: "User Facility Shipped",
        location: info.pickupLocation || "User Facility",
        date: (shipment.pickupDate as string) || "",
        status: shipment.isDispatched ? "completed" : "in-progress",
        carrier: shipment.carrier as string,
        customer: info.customerName || "Patient",
        ssccBarcode: shipment.ssccBarcode as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        quantity: info.quantity,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
          patient: {
            name: shipment.name,
            county: shipment.county,
            gender: shipment.gender,
            yearOfBirth: shipment.yearOfBirth,
          },
        },
      });
    });
  }

  // User Facility returns steps
  const userFacilityReturns = data.userFacility?.returns;
  if (userFacilityReturns && userFacilityReturns.length > 0) {
    userFacilityReturns.forEach((shipment) => {
      const info = extractFacilityInfo(shipment);
      journeySteps.push({
        title: "User Facility Return Shipped",
        location: info.pickupLocation || "User Facility",
        date: (shipment.pickupDate as string) || "",
        status: shipment.isDispatched ? "completed" : "in-progress",
        carrier: shipment.carrier as string,
        customer: info.customerName || "Patient",
        ssccBarcode: shipment.ssccBarcode as string,
        parentssccBarcode: shipment.parentssccBarcode as string,
        returnType: shipment.returnType as string,
        returnMessage: shipment.returnMessage as string,
        // Product Details
        productName: info.productName,
        productBrand: info.productBrand,
        productGtin: info.productGtin,
        productId: info.productId,
        productUserId: info.productUserId,
        productIsEnabled: info.productIsEnabled,
        productCreatedAt: info.productCreatedAt,
        productUpdatedAt: info.productUpdatedAt,
        // Batch Details
        quantity: info.quantity,
        // Shipment Details
        destinationAddress: info.destinationAddress,
        pickupLocation: info.pickupLocation,
        expectedDeliveryDate: info.expectedDeliveryDate,
        eventTime: info.eventTime,
        eventStatus: info.eventStatus,
        // GLN & Company Details
        manufacturerCompany: info.manufacturerCompany,
        manufacturerGln: info.manufacturerGln,
        // Additional
        serializationCount: info.serializationCount,
        shipmentId: info.shipmentId,
        details: {
          manufacturer: info.manufacturerCompany,
          manufacturerGln: info.manufacturerGln,
          customer: info.customerName,
          returnType: shipment.returnType,
          returnMessage: shipment.returnMessage,
          product: {
            name: info.productName,
            brand: info.productBrand,
            gtin: info.productGtin,
            id: info.productId,
            userId: info.productUserId,
            isEnabled: info.productIsEnabled,
            createdAt: info.productCreatedAt,
            updatedAt: info.productUpdatedAt,
          },
          quantity: info.quantity,
          serializationCount: info.serializationCount,
          patient: {
            name: shipment.name,
            county: shipment.county,
            gender: shipment.gender,
            yearOfBirth: shipment.yearOfBirth,
          },
        },
      });
    });
  }

  return journeySteps;
};

const UnifiedJourneyViewer: React.FC<UnifiedJourneyViewerProps> = ({
  data,
  className = "",
}) => {
  // Use provided journeySteps or build from API structure
  const journeySteps = data.journeySteps || buildJourneySteps(data);

  // Determine identifier (SSCC or Serial)
  const identifier =
    data.sscc ||
    (typeof data.serial === "string" ? data.serial : data.serial?.code);
  const identifierLabel = data.sscc ? "SSCC" : "Serial Number";

  // Determine title
  const title = data.sscc ? "SSCC Journey" : "Serial Number Journey";

  if (!journeySteps || journeySteps.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          No journey data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {identifier && (
            <div className="text-sm text-gray-600">
              {identifierLabel}:{" "}
              <span className="font-mono font-semibold">{identifier}</span>
            </div>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        {journeySteps.map((step, index) => (
          <JourneyStepItem key={`step-${index}`} step={step} index={index} />
        ))}
      </div>
    </div>
  );
};

export default UnifiedJourneyViewer;
