CREATE TABLE `tipos_equipo` (
  `id` char(1) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_equipo`
--

INSERT INTO `tipos_equipo` (`id`, `nombre`) VALUES
('A', 'ARMAMENTO'),
('V', 'AUTOMOTORES'),
('P', 'AVIACIÓN'),
('E', 'ELECTRÓNICA Y ELECTRICIDAD'),
('H', 'EQUIPOS DE TALLER, MÁQUINAS Y HERRAMIENTAS'),
('I', 'INGENIEROS'),
('G', 'MAT GENERALES'),
('M', 'MUNICIÓN'),
('O', 'OP, INSTRUMENTAL Y EQU DE LABORATORIO'),
('Z', 'REP. DE ARS');