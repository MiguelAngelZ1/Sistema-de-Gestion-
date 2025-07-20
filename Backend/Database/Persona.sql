CREATE TABLE `persona` (
  `id_persona` int(11) NOT NULL,
  `id_grado` int(11) DEFAULT NULL,
  `id_armesp` int(11) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `nro_dni` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;