CREATE TABLE IF NOT EXISTS ubicaciones (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL,
    piso    INTEGER      NOT NULL,
    descripcion TEXT,
    qr_code VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO ubicaciones (nombre, piso, descripcion, qr_code) VALUES
('Laboratorio 301', 3, 'Laboratorio de computación, capacidad 30 personas. Equipado con PCs y proyector.', 'QR-LAB-301'),
('Sala 201',        2, 'Sala de clases, capacidad 40 personas. Proyector y pizarrón interactivo.',          'QR-SALA-201'),
('Biblioteca',      1, 'Biblioteca con acceso a recursos digitales. Horario: 08:00–20:00.',                 'QR-BIBLIOTECA'),
('Sala de Reuniones 101', 1, 'Sala de reuniones, capacidad 10 personas. Requiere reserva previa.',          'QR-SR-101'),
('Laboratorio 401', 4, 'Laboratorio especializado. Acceso con credenciales de docente.',                    'QR-LAB-401');
