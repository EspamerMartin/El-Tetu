"""
Generador de PDF para remitos de pedidos.
Usa ReportLab para crear documentos PDF profesionales.
"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from zoneinfo import ZoneInfo

# Zona horaria de Argentina (Buenos Aires)
TIMEZONE_AR = ZoneInfo('America/Argentina/Buenos_Aires')


def generar_remito_pdf(pedido):
    """
    Genera un PDF de remito para un pedido.
    
    Args:
        pedido: Instancia del modelo Pedido con items precargados
        
    Returns:
        BytesIO: Buffer con el contenido del PDF
    """
    buffer = BytesIO()
    
    # Configuración del documento
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    styles.add(ParagraphStyle(
        name='TituloEmpresa',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=6,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#6B2D8B'),  # Color púrpura de la marca
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='TituloRemito',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=12,
        spaceAfter=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#333333'),
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SeccionTitulo',
        parent=styles['Heading3'],
        fontSize=11,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor('#6B2D8B'),
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='TextoNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=3,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='TextoPequeno',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#666666'),
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='TotalGrande',
        parent=styles['Normal'],
        fontSize=14,
        fontName='Helvetica-Bold',
        alignment=TA_RIGHT
    ))
    
    # Contenido del PDF
    elementos = []
    
    # === ENCABEZADO ===
    elementos.append(Paragraph("El Tetú", styles['TituloEmpresa']))
    elementos.append(Paragraph("REMITO DE ENTREGA", styles['TituloRemito']))
    
    # Línea separadora
    elementos.append(HRFlowable(
        width="100%", 
        thickness=1, 
        color=colors.HexColor('#6B2D8B'),
        spaceBefore=6,
        spaceAfter=12
    ))
    
    # === DATOS DEL PEDIDO ===
    # Convertir fechas de UTC a Argentina (UTC-3)
    fecha_creacion_utc = pedido.fecha_creacion
    if fecha_creacion_utc.tzinfo is None:
        # Fecha naive: asumir UTC
        fecha_creacion_utc = fecha_creacion_utc.replace(tzinfo=ZoneInfo('UTC'))
    fecha_creacion_ar = fecha_creacion_utc.astimezone(TIMEZONE_AR)
    
    fecha_pedido = fecha_creacion_ar.strftime('%d/%m/%Y %H:%M')
    fecha_generacion = datetime.now(TIMEZONE_AR).strftime('%d/%m/%Y %H:%M')
    
    # Estado en español
    estados = {
        'PENDIENTE': 'Pendiente',
        'EN_PREPARACION': 'En Preparación',
        'FACTURADO': 'Facturado',
        'ENTREGADO': 'Entregado',
        'RECHAZADO': 'Rechazado'
    }
    estado_display = estados.get(pedido.estado, pedido.estado)
    
    # Tabla de información del pedido (2 columnas)
    info_pedido = [
        ['Pedido Nº:', f'{pedido.id}', 'Fecha del Pedido:', fecha_pedido],
        ['Estado:', estado_display, 'Fecha de Emisión:', fecha_generacion],
    ]
    
    tabla_info = Table(info_pedido, colWidths=[3*cm, 5*cm, 3.5*cm, 5*cm])
    tabla_info.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6B2D8B')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#6B2D8B')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elementos.append(tabla_info)
    elementos.append(Spacer(1, 12))
    
    # === DATOS DEL CLIENTE ===
    elementos.append(Paragraph("DATOS DEL CLIENTE", styles['SeccionTitulo']))
    
    cliente = pedido.cliente
    
    # Construir dirección completa
    partes_direccion = []
    if cliente.calle:
        direccion_str = cliente.calle
        if cliente.numero:
            direccion_str += f" {cliente.numero}"
        partes_direccion.append(direccion_str)
    if cliente.entre_calles:
        partes_direccion.append(f"({cliente.entre_calles})")
    if cliente.zona:
        partes_direccion.append(f"Zona: {cliente.zona.nombre}")
    
    direccion_completa = " - ".join(partes_direccion) if partes_direccion else (cliente.direccion or "Sin dirección")
    
    elementos.append(Paragraph(f"<b>Nombre:</b> {cliente.full_name}", styles['TextoNormal']))
    elementos.append(Paragraph(f"<b>Teléfono:</b> {cliente.telefono or 'No especificado'}", styles['TextoNormal']))
    elementos.append(Paragraph(f"<b>Dirección:</b> {direccion_completa}", styles['TextoNormal']))
    
    if cliente.descripcion_ubicacion:
        elementos.append(Paragraph(f"<b>Referencia:</b> {cliente.descripcion_ubicacion}", styles['TextoNormal']))
    
    if cliente.cuit_dni:
        elementos.append(Paragraph(f"<b>CUIT/DNI:</b> {cliente.cuit_dni}", styles['TextoNormal']))
    
    elementos.append(Spacer(1, 12))
    
    # === TRANSPORTADOR (si está asignado) ===
    if pedido.transportador:
        elementos.append(Paragraph("TRANSPORTADOR ASIGNADO", styles['SeccionTitulo']))
        elementos.append(Paragraph(
            f"<b>Nombre:</b> {pedido.transportador.full_name}", 
            styles['TextoNormal']
        ))
        if pedido.transportador.telefono:
            elementos.append(Paragraph(
                f"<b>Teléfono:</b> {pedido.transportador.telefono}", 
                styles['TextoNormal']
            ))
        elementos.append(Spacer(1, 12))
    
    # === DETALLE DE PRODUCTOS ===
    elementos.append(Paragraph("DETALLE DE PRODUCTOS", styles['SeccionTitulo']))
    
    # Encabezado de la tabla
    datos_productos = [['Producto', 'Cant.', 'P. Unit.', 'Subtotal']]
    
    # Filas de productos
    for item in pedido.items.all():
        nombre_producto = item.producto_nombre_snapshot or (
            item.producto.nombre if item.producto else "Producto eliminado"
        )
        # Truncar nombre si es muy largo
        if len(nombre_producto) > 40:
            nombre_producto = nombre_producto[:37] + "..."
            
        datos_productos.append([
            nombre_producto,
            str(item.cantidad),
            f"${item.precio_unitario:,.2f}",
            f"${item.subtotal:,.2f}"
        ])
    
    # Crear tabla de productos
    tabla_productos = Table(
        datos_productos, 
        colWidths=[9*cm, 2*cm, 3*cm, 3*cm]
    )
    
    tabla_productos.setStyle(TableStyle([
        # Encabezado
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6B2D8B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Cuerpo
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),  # Cantidad centrada
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),  # Precios a la derecha
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        
        # Bordes
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#6B2D8B')),
        
        # Filas alternadas
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))
    
    elementos.append(tabla_productos)
    elementos.append(Spacer(1, 12))
    
    # === TOTALES ===
    subtotal = float(pedido.subtotal)
    descuento = float(pedido.descuento_total)
    total = float(pedido.total)
    
    datos_totales = [
        ['', '', 'Subtotal:', f"${subtotal:,.2f}"],
    ]
    
    if descuento > 0:
        lista_nombre = pedido.lista_precio_nombre_snapshot or (
            pedido.lista_precio.nombre if pedido.lista_precio else "Descuento"
        )
        datos_totales.append(['', '', f'Descuento ({lista_nombre}):', f"-${descuento:,.2f}"])
    
    datos_totales.append(['', '', 'TOTAL:', f"${total:,.2f}"])
    
    tabla_totales = Table(datos_totales, colWidths=[9*cm, 2*cm, 3*cm, 3*cm])
    tabla_totales.setStyle(TableStyle([
        ('FONTNAME', (2, 0), (2, -2), 'Helvetica-Bold'),
        ('FONTNAME', (2, -1), (2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, -1), (3, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -2), 10),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('TEXTCOLOR', (2, -1), (-1, -1), colors.HexColor('#6B2D8B')),
        ('LINEABOVE', (2, -1), (-1, -1), 1, colors.HexColor('#6B2D8B')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
    ]))
    
    elementos.append(tabla_totales)
    elementos.append(Spacer(1, 20))
    
    # === NOTAS ===
    if pedido.notas:
        elementos.append(Paragraph("NOTAS", styles['SeccionTitulo']))
        elementos.append(Paragraph(pedido.notas, styles['TextoNormal']))
        elementos.append(Spacer(1, 20))
    
    # === FIRMA DE RECEPCIÓN ===
    elementos.append(Spacer(1, 20))
    elementos.append(Paragraph("CONSTANCIA DE RECEPCIÓN", styles['SeccionTitulo']))
    elementos.append(Spacer(1, 15))
    
    # Fila 1: Recibido por (izq) | Firma (der)
    datos_firma_1 = [
        ['Recibido por:', '', 'Firma:'],
        ['', '', ''],
    ]
    tabla_firma_1 = Table(datos_firma_1, colWidths=[8*cm, 1*cm, 7*cm])
    tabla_firma_1.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#666666')),
        ('LINEBELOW', (0, 1), (0, 1), 0.5, colors.HexColor('#999999')),
        ('LINEBELOW', (2, 1), (2, 1), 0.5, colors.HexColor('#999999')),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 20),
    ]))
    elementos.append(tabla_firma_1)
    elementos.append(Spacer(1, 15))
    
    # Fila 2: Fecha de entrega (izq) | Aclaración (der)
    datos_firma_2 = [
        ['Fecha de entrega:', '', 'Aclaración:'],
        ['', '', ''],
    ]
    tabla_firma_2 = Table(datos_firma_2, colWidths=[8*cm, 1*cm, 7*cm])
    tabla_firma_2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#666666')),
        ('LINEBELOW', (0, 1), (0, 1), 0.5, colors.HexColor('#999999')),
        ('LINEBELOW', (2, 1), (2, 1), 0.5, colors.HexColor('#999999')),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 20),
    ]))
    elementos.append(tabla_firma_2)
    
    # Pie de página
    elementos.append(Spacer(1, 20))
    elementos.append(Paragraph(
        f"Documento generado el {fecha_generacion} - El Tetú", 
        styles['TextoPequeno']
    ))
    
    # Generar PDF
    doc.build(elementos)
    buffer.seek(0)
    
    return buffer

