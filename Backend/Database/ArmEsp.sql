CREATE TABLE `armesp` (
  `id_armesp` int(11) NOT NULL,
  `abreviatura` varchar(50) NOT NULL,
  `armesp_completo` varchar(100) NOT NULL,
  `tipo` enum('Arma','Especialidad') NOT NULL DEFAULT 'Arma'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;