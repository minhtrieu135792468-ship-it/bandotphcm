import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState, useRef, type ReactNode } from 'react';
import { Search, MapPin, Building, History, ExternalLink, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Constants
const BOLD_COLORS = [
  '#b91c1c', '#1d4ed8', '#047857', '#b45309', '#6d28d9', 
  '#be185d', '#0e7490', '#4338ca', '#c2410c', '#15803d',
  '#991b1b', '#1e40af', '#065f46', '#92400e', '#5b21b6',
  '#9d174d', '#155e75', '#3730a3', '#9a3412', '#166534'
];

const getRandomColor = () => BOLD_COLORS[Math.floor(Math.random() * BOLD_COLORS.length)];

// Types
interface WardAttribute {
  name: string;
  merger: string;
  headquarters: string;
  history: string;
  meaning: string;
  area: string;
  population: string;
}

interface MergedFeature extends GeoJSON.Feature {
  id?: string | number;
  properties: {
    Name: string;
    Ten_Xa?: string;
    details?: WardAttribute;
    color?: string;
  };
}

// Data Parsing - 168 wards total
const rawCsvData = `Phường Sài Gòn|Bến Nghé, một phần phường Đa Kao và Nguyễn Thái Bình|45 – 47 Lê Duẩn|Thuở xưa mang tên Prey Nokor - rừng cây gòn.|Có người cho rằng, thuở xa xưa, vùng đất này là Prey Nokor trong tiếng Khmer, nghĩa là "rừng cây gòn", nơi những thân cây cao lớn nở bông trắng xóa mỗi độ vào mùa. Trải qua thời gian và biến đổi âm sắc, cái tên ấy dần thành "Sài Gòn" trong lời ăn tiếng nói của người dân nơi đây.|3.038|47.022
Phường Tân Định|Tân Định và một phần phường Đa Kao|58B Nguyễn Đình Chiểu|Có nghĩa là Gia Định mới, miền đất trẻ.|Người ta gọi tên chốn này là Tân Định có nghĩa là "Gia Định mới", một miền đất trẻ mang hơi thở mới. Vì trước đó, từ cuối thế kỷ XVII, những đoàn lưu dân từ miền Bắc và miền Trung đã tìm đến đây, buông lưới bắt cá, dựng chòi bên mép nước, khai phá đất hoang để trồng rau, trồng lúa. Dần dà, từng mái lá, chiếc ghe của những người dân từ Bến Nghé xuôi về đã tạo nên một xóm vạn chài nhộn nhịp. Chợ họp bên sông, tiếng gọi đò, tiếng búa, tiếng rao hàng hòa vào nhau, biến nơi đây thành một thị tứ mới của vùng Gia Định.|1.23|48.524
Phường Bến Thành|Bến Thành, Phạm Ngũ Lão, Cầu Ông Lãnh, NTB|92 Nguyễn Trãi|Bắt nguồn từ bến đò xưa cửa ngõ thành Phiên Ân.|Tên gọi "Bến Thành" bắt nguồn từ vị trí địa lý tự nhiên. Vì bến đò xưa nằm ngay cửa ngõ thành Phiên Ân, nên được người dân gọi là Bến Thành.|1.852|71.875
Phường Cầu Ông Lãnh|Nguyễn Cư Trinh, Cầu Kho, Cô Giang, Cầu Ông Lãnh|105 Trần Đình Xu|Gắn với ông Lãnh binh Nguyễn Ngọc Thăng.|Tên gọi "Cầu Ông Lãnh" gắn với câu chuyện ông Lãnh binh Nguyễn Ngọc Thăng cho xây dựng cầu để người dân tiện đi lại. Để ghi nhớ công ơn của ông, người dân địa phương đã đtặ tên là Cầu Ông Lãnh.|1.6|78.734
Phường Bàn Cờ|Phường 1, 2, 3, 5, một phần phường 4 (Quận 3)|611/20 Điện Biên Phủ|Bắt nguồn từ mâm xoay quay đầu xe lửa thuở xưa.|Theo nhà văn Sơn Nam, tên gọi này còn có thể bắt nguồn từ việc: thuở xưa, tại đây từng đặt điểm lấy nước cho đầu máy tuyến đường sắt Sài Gòn - Mỹ Tho. Mỗi khi tàu đến lấy nước và quay đầu trở lại ga Sài Gòn, đầu máy được đặt lên một mâm xoay quanh trục, có những vạch vuông chống trượt mà người thợ gọi đó là "bàn cờ".|0.99|67.634
Phường Xuân Hòa|Võ Thị Sáu, một phần phường 4 (Quận 3)|99 – 99A Trần Quốc Thảo|Ý nghĩa mùa xuân hòa thuận, tràn đầy sức sống.|Tên gọi "Xuân Hòa" mang ý nghĩa "mùa xuân hòa thuận", thể hiện mong ước về một vùng đất yên bình, tràn đầy sức sống và sự đoàn kết.|2.217|48.466
Phường Nhiêu Lộc|Phường 9, 11, 12, 14 (Quận 3)|82 Bà Huyện Thanh Quan|Ghi nhớ vị Nhiêu học mang tên Lộc.|Về tên gọi "Nhiêu Lộc", có giai thoại kể rằng, thuở ấy có ông Đặng Lộc, đỗ đầu kỳ thi Hương, giữ chức Nhiêu học, đã bỏ công sức và tiền của nạo vét, chỉnh trang con kênh để thuận tiên giao thông thủy, giúp dân đi lại dễ dàng. Người dân vì thế gọi dòng kênh này là Nhiêu Lộc - để ghi nhớ vị Nhiêu học mang tên Lộc.|1.71|88.090
Phường Xóm Chiếu|Phường 13, 16, 18, một phần phường 15 (Quận 4)|18 Đoàn Như Hài|Bắt nguồn từ nghề dệt chiếu nổi tiếng xưa.|Tên gọi "Xóm Chiếu" bắt nguồn từ nghề dệt chiếu và bán chiếu nổi tiếng của cộng đồng dân cư khu vực này thuở xưa. Đây không chỉ là một địa danh, mà còn là một di sản sống, là quá khứ nền tảng cho hiện tại phát triển vươn xa.|1.94|57.875
Phường Khánh Hội|Phường 8, 9, một phần phường 2, 4 và 15 (Quận 4)|531 Vĩnh Khánh|Ý nghĩa vùng đất cát tường, hội tụ niềm vui.|Tên gọi " Khánh Hội" mang ý nghĩa về vùng đất của sự cát tường, là nơi hội tụ, mang lại niềm vui và sự an lành cho cộng đồng cư dân.|1.07|94.507
Phường Vĩnh Hội|Phường 1, 3, một phần phường 2 và 4 (Quận 4)|130 đường 46|Ý nghĩa sự hội tụ bền vững của các địa danh xưa.|Tên gọi " Vĩnh Hội" mang ý nghĩa sự hội tụ bền vững, là sự ghép nối của địa danh Vĩnh Khánh, Tân Vĩnh, Vĩnh Hội, nhưng cũng là sự hòa quyện của con người và đời sống, tạo nên một vùng đất sầm uất nơi bến cảng, ghe thuyền tấp nập qua lại.|1.17|63.015
Phường Chợ Quán|Phường 1, 2, 4 (Quận 5)|53 A Trần Phú|Bắt nguồn từ dãy quán xá gần Nhà thương Chợ Quán.|Theo học giả Vương Hồng Sển trong bài Sài Gòn năm xưa, tên "Chợ Quán" bắt nguồn từ dãy quán xá và những phiên chợ tạm mọc san sát bên các tuyến giao thương, đặc biệt là gần lối vào Nhà thương Chợ Quán, dưới những tán me già rợp bón. Nét sầm uất ấy đã trở thành dấu ấn, để rồi cái tên Chợ Quán được người dân trìu mến dùng cho cả một vùng.|1.28|63.545
Phường An Đông|Phường 5, 7, 9 (Quận 5)|45 Phước Hưng|Vùng đất yên bình ở phía Đông.|Tên gọi "An Đông" có thể hiểu là vùng đất yên bình ở phía Đông, gợi lên hình ảnh một vùng đất an lành, nơi người dân có thể định cư, làm ăn và phát triển.|1.32|81.229
Phường Chợ Lớn|Phường 11, 12, 13, 14 (Quận 5)|527 Hồng Bàng|Tên gọi bắt nguồn từ ngôi chợ Đề Ngạn quy mô lớn.|Tên gọi "Chợ Lớn" bắt nguồn từ việc chợ Đề Ngạn sau khi xây dựng có quy mô lớn, đông đúc, buôn bán sầm uất, nên người dân gọi nôm na là "Chợ Lớn" để phân biệt với các chợ khác. Từ tên gọi chỉ một ngôi chợ lâu dần trở thành danh xưng cho cả vùng đất rộng lớn phía Tây Nam Sài Gòn.|1.67|85.066
Phường Bình Tây|Phường 2, 9 (Quận 6)|107 Cao Văn Lầu|Ý nghĩa vùng đất yên bình phía Tây.|Tên gọi "Bình Tây" mang nghĩa vùng đất yên bình phía Tây, giờ đây không chỉ là cái tên để gợi nhớ một làng xưa, mà còn là nhịp nối giữa quá khứ thương hồ và sức sống phồn hoa của đô thị hôm nay.|1.05|45.861
Phường Bình Tiên|Phường 1, 7, 8 (Quận 6)|154 Tháp Mười|Ý nghĩa vùng đất yên bình của tổ tiên.|Tên gọi "Bình Tiên" mang nghĩa về vùng đất yên bình của tổ tiên hay biểu tượng của một miền bình an, ổn định, vừa gợi nhớ ký ức xưa, vừa mở ra kỳ vọng về một cộng đồng gắn kết, an hòa giữa lòng đô thi sôi động.|1.61|66.707
Phường Bình Phú|Phường 10, 11 (Quận 6), một phần phường 16 (Quận 8)|15 Chợ Lớn|Vùng đất yên bình và phú túc mà tiền nhân gửi gắm.|Tên gọi "Bình Phú" mang ý nghĩa về vùng đất yên bình và phú túc mà tiền nhân đã gửi gắm. Bình Phú không chỉ là nơi lưu giữ của một vùng ven thương hồ mà còn mang dáng dấp đô thị hiện đại, nhịp sống sôi động hòa cùng khát vọng thịnh vượng của cư dân.|2.86|66.586
Phường Phú Lâm|Phường 12, 13, 14 (Quận 6)|152 Đặng Nguyên Cẩn|Theo nghĩa Hán Việt là khu rừng giàu có.|Tên gọi "Phú Lâm" theo nghĩa Hán Việt là "khu rừng giàu có" vừa gợi nhớ về hình ảnh vùng đất này từ những ngày đầu khai phá, vừa phản ánh khát vọng về sự phồn vinh, sung túc của người dân.|2.00|74.276
Phường Tân Thuận|Bình Thuận, Tân Thuận Đông, Tân Thuận Tây|342 Huỳnh Tấn Phát|Ý nghĩa vùng đất mới thuận lợi, phát triển.|Tên gọi "Tân Thuận" mang ý nghĩa vùng đất mới thuận lợi, phát triển, thể hiện kỳ vọng về một khu vực giàu tiềm năng và phát triển.|10.16|125.281
Phường Phú Thuận|Phú Thuận và một phần phụ phường Phú Mỹ|1203 Huỳnh Tấn Phát|Ý nghĩa vùng đất thịnh vượng và thuận lợi.|Tên gọi "Phú Thuận" mang ý nghĩa về vùng đất thịnh vượng và thuận lợi, không chỉ phản ánh đặc điểm vị trí thuận thông thương, mà còn gửi gắm khát vọng của cư dân về một nơi an cư, no ấm và phát triển bền vững.|10.55|56.687
Phường Tân Mỹ|Tân Phú và một phần phường Phú Mỹ|7 đường Tân Phú|Ý nghĩa vùng đất mới tốt đẹp, trù phú.|Tên gọi "Tân Mỹ" mang ý nghĩa vùng đất mới tốt đẹp, vừa phản ánh sự trù phú của thiên nhiên, vừa thể hiện kỳ vọng về một khu đô thị hiện đại, văn minh, chan hòa nhịp sống đô thị với hơi thở của sông nước phương Nam.|6.45|66.887
Phường Tân Hưng|Tân Phong, Tân Quy, Tân Kiểng, Tân Hưng|9 đường 2A|Ý nghĩa vùng đất mới hưng thịnh.|Tên gọi "Tân Hưng" mang ý nghĩa là vùng đất mới hưng thịnh, không chỉ là một danh xưng hành chính, mà còn là lời gửi gắm niềm tin vào tương lai phồn vinh.|8.54|182.417
Phường Chánh Hưng|Phường 4 (Q.8), Rạch Ông, Hưng Phú, môt phần 5 (Q.8)|39 Dương Bạch Mai|Ý nghĩa chính trực and hưng thịnh.|Tên gọi "Chánh Hưng" mang ý nghĩa chính trực và hưng thịnh, phản ánh phẩm chất con người nơi đây, cũng như kỳ vọng về sự phát triển ổn định của vùng đất này.|4.61|190.707
Phường Phú Định|Phường 14, 15, Xóm Củi, một phần 16 (Q.8)|184 Lưu Hữu Phước|Vùng đất phú túc, vững bền bên sông.|Cái tên "Phú Định" mang ý nghĩa vùng đất phú túc, vững bền, là lời gửi gắm về sự thịnh vượng của cộng đồng ven sông. Phú Định không chỉ là một địa danh mà là nơi quá khứ và hiện tại giao hòa, chở đầy câu chuyện của vùng đất phương Nam.|5.85|150.389
Phường Bình Đông|Phường 6, một phần 5, 7 (Q.8), An Phú Tây (BC)|1094 Tạ Quang Bửu|Vùng đất yên bình phía Đông.|Tên gọi "Bình Đông" mang ý nghĩa là vùng đất yên bình phía Đông, thể hiện vị trí địa lý ven kênh rạch của khu vực và kỳ vọng về sự ổn định, trù phú của cộng đồng dân cư nơi đây.|8.93|156.332
Phường Diên Hồng|Phường 6, 8, một phần phường 14 (Quận 10)|1a Thành Thái|Gợi nhớ hội nghị lịch sử năm 1284.|Tên gọi "Diên Hồng" - hai tiếng gợi nhớ hội nghị lịch sử năm 1284 tại kinh thành Thăng Long, khi các bô lão khắp nơi cùng đồng hành "Quyết chiến!" trước họa xâm lăng, hun đúc nên hào khí Đông A lẫy lừng thời Trần.|1.86|59.218
Phường Vườn Lài|Phường 1, 2, 4, 9, 10 (Quận 10)|168 Hùng Vương|Gợi nhớ mùi hương thanh khiết của hoa Lài xưa.|Tên gọi "Vườn Lài" xuất phát từ loài cây trồng đặc trưng của vùng, gợi nhớ mùi hương thanh khiết của hoa Lài và phảng phất khí phách kiên cường của một vùng đất anh hùng.|1.27|76.425
Phường Hòa Hưng|Phường 12, 13, 15, một phần phường 14 (Quận 10)|A8 Châu Thới|Vùng đất hòa thuận, hưng thịnh.|Tên gọi "Hòa Hưng" mang ý nghĩa về vùng đất hòa thuận, hưng thịnh, không chỉ là lời chúc phúc của tiền nhân, mà còn là khát vọng hôm nay: một cộng đồng đoàn kết, ổn định, giàu sức sống.|2.59|75.180
Phường Minh Phụng|Phường 1, 7, 16 (Quận 11)|183 A Lý Nam Đế|Vùng đất sáng, quý và thịnh vượng.|Tên gọi "Minh Phụng" mang ý nghĩa về vùng đất sáng, quý và thịnh vượng, là lời nhắn gửi về khát vọng vươn lên, về một cộng đồng đoàn kết, gìn giữ hồn xưa giữa nhịp sống đô thị sôi động|1.27|74.459
Phường Bình Thới|Phường 3, 10, một phần phường 8 (Quận 11)|270 Bình Thới|Vùng đất bình yên và thịnh vượng.|Tên gọi "Bình Thới" mang ý nghĩa về vùng đất bình yên và thịnh vượng, không chỉ là lời ước nguyện của tiền nhân, mà còn là niềm tin về một cộng đồng đoàn kết, phát triển bền vững, giữ gìn hồn xưa giữa nhịp sống hiện đại.|1.52|55.851
Phường Hòa Bình|Phường 5, 14 (Quận 11)|347 Lạc Long Quân|Dấu ấn tinh thần hòa hợp dân tộc.|Tên gọi "Hòa Bình" mang ý nghĩa một vùng đất hòa hợp, yên ổn và thanh bình, là niềm tin vào một cộng đồng bền chặt, nơi nhịp sống an cư lạc nghiệp.|1.8|65.000
Phường Bình Hưng Hòa|Bình Hưng Hòa, một phần Sơn Kỳ, BHH A|621 Tân Kỳ Tân Quý|Vùng đất yên lành, hưng thịnh.|Tên gọi "Bình Hưng Hòa" như lời nhắc nhở về một vùng đất yên lành, hưng thịnh, nơi cộng đồng gắn bó, chan hòa.|9.439|186.857
Phường Gia Định|Phường 1, 2, 7, 17 (Bình Thạnh)|98 Lê Văn Duyệt|Gia là mở rộng, định là định cư.|Tên gọi "Gia Định" theo Nhà nghiên cứu lịch sử Nguyễn Đình Tư có nghĩa: "Gia là mở rộng, định là định cư. Gia Định tức chỉ vùng đất người dân miền Trung, miền Bắc mở rộng và sinh sống, định cư ổn định vững vàng".|2.76|120.310
Phường Bình Thạnh|Phường 12, 14, 26 (Bình Thạnh)|6 Phan Đăng Lưu|Hàm chứa ước vọng yên bình, thịnh vượng.|Hai chữ "Bình Thạnh" trong tên gọi được ghép từ Bình Hòa và Thạnh Mỹ Tây, là hai địa danh tiêu biểu, hàm chứa ước vọng yên bình, thịnh vượng.|3.32|117.497
Phường Bình Lợi Trung|Phường 5, 11, 13 (Bình Thạnh)|133 Nguyễn Văn Đậu|Vùng đất trung tâm, yên bình phát triển.|Tên gọi "Bình Lợi Trung" mang ý nghĩa vùng đất trung tâm, yên bình và phát triển thuận lợi. Do cùng là lời gửi gắm ước vọng của bao thế hệ cư dân về một nơi sống an hòa, sung túc, con người gắn bó, cùng dựng xây cuộc sống no đủ.|3.89|102.084
Phường Thạnh Mỹ Tây|Phường 19, 22, 25 (Bình Thạnh)|85/16 Phạm Viết Chánh|Vùng đất phồn thịnh tốt đẹp ở phía Tây.|Tên gọi "Thạnh Mỹ Tây" không chỉ gửi gắm ước vọng về một vùng đất phồn thịnh, tốt đẹp ở phía Tây con sông Sài Gòn thuở xưa, mà còn gợi hình ảnh những bãi bờ phù sa, làng xóm yên ả của một thời khai khẩn.|4.4|152.371
Phường Bình Quới|Phường 27, 28 (Bình Thạnh)|Số 1 khu hành chính Thanh Đa|Vùng đất quý giá, yên bình, vững bền.|Tên gọi "Bình Quới" hàm chứa ước vọng về một vùng đất quý giá, yên bình, vững bền, nơi phù sa sông Sài Giòn bồi đắp nên vườn tược xanh tươi, đời sống thanh bình.|6.34|36.019
Phường Hạnh Thông|Phường 1, 3 (Gò Vấp)|306 Nguyễn Văn Nghi|Hạnh phúc, ấm no, hanh thông.|Tên gọi "Hạnh Thông" gợi nên hình ảnh một vùng đất nơi đời sống con người được vun đắp bởi sự hạnh phúc, ấm no, và mọi sự đều thuận lợi, hanh thông.|3.37|127.135
Phường An Nhơn|Phường 5, 6 (Gò Vấp)|1C Nguyễn Văn Lượng|Vùng đất yên bình, nhân hậu.|Tên gọi "An Nhơn" mang ý nghĩa vùng đất yên bình, nhân hậu, có thể do người dân gốc Phủ An Nhơn (Bình Định) khi đến đây khai hoang lập nghiệp đặt để ghi nhớ quê xưa.|3.23|96.717
Phường Gò Vấp|Phường 10, 17 (Gò Vấp)|332 Quang Trung|Vùng gò cao có nhiều cây Vắp xưa.|Tên gọi "Gò Vấp" vốn bắt ngưồn từ "Gò Vắp" nghĩa là vùng gò cao có nhiều cây Vắp, loài cây dẻo dai, gắn bó với đời sống người dân.|2.81|99.629
Phường An Hội Đông|Phường 15, 16 (Gò Vấp)|330 Thống Nhất|Vùng đất hội tụ bình yên nơi phía Đông.|Tên gọi "An Hội Đông" hàm chứa ý nghĩa vùng đất hội tụ bình yên nơi cửa ngõ phía Đông, nơi người dân tụ hội, chung sống chan hòa qua bao thế hệ.|3.29|112.067
Phường Thông Tây Hội|Phường 8, 11 (Gò Vấp)|175 Nguyễn Văn Khối|Ước vọng vùng đất mở mang, kết nối.|Tên gọi "Thông Tây Hội" không chỉ là một địa danh, mà còn gửi gắm ước vọng về một vùng đất mở mang, nơi giao thương, kết nối thuận lợi. Chữ "Thông" là sự thông suốt, hanh thông; "Tây" chỉ hướng Tây, hướng đất lành của làng xưa; còn "Hội" mang nghĩa hội tụ, sum vầy.|3.24|118.826
Phường An Hội Tây|Phường 12, 14 (Gò Vấp)|397 Phan Huy Ích|Vùng đất hội tụ bình yên nơi phía Tây.|Tên gọi "An Hội Tây" hàm chứa ý nghĩa vùng đất hội tụ bình yên nơi cửa ngõ phía Tây, nơi người dân sum vầy, làng nghề bền bỉ giữ lửa qua bao thế hệ|3.79|115.989
Phường Đức Nhuận|Phường 4, 5, 9 (Phú Nhuận)|744 Nguyễn Kiệm|Đức độ làm đẹp bản thân.|Tên gọi "Đức Nhuận" xuất phát từ câu nói của người xưa "Phú nhuận ốc, đức nhuận thân", có nghĩa là giàu có làm đẹp nhà cửa, đức độ làm đẹp bản thân.|2.16|71.848
Phường Cầu Kiệu|Phường 1, 2, 7, một phần 15 (Phú Nhuận)|458 Phan Xích Long|Bắt nguồn từ xóm trồng Kiệu xưa.|Tên gọi "Cầu Kiệu" bắt nguồn từ xóm trồng Kiệu xưa của người Triều Châu tại khu vực hai bên cầu.|1.23|77.995
Phường Phú Nhuận|Phường 8, 10, 11, 13, một phần 15 (Phú Nhuận)|159 Nguyễn Văn Trỗi|Ý nghĩa vùng đất sung túc, thịnh vượng.|Tên gọi "Phú Nhuận" mang ý nghĩa vùng đất sung túc, thịnh vượng, nơi hội tụ của sự ấm no và phát triển.|1.46|65.244
Phường Tân Sơn Hòa|Phường 1, 2, 3 (Tân Bình)|291 Lê Văn Sỹ|Vùng đất gò cao khô ráo ổn định.|Tên gọi "Tân Sơn Hòa" hàm chứa nhiều lớp nghĩa. "Tân" gợi về sự mới mẻ, mở mang; "Sơn" chỉ vùng đất gò cao, khô ráo, vững chãi; "Hòa" biểu thị sự yên ổn, thuận hòa trong đời sống cộng đồng.|2.61|58.783
Phường Tân Sơn Nhất|Phường 4, 5, 7 (Tân Bình)|25/4-6 Hoàng Việt|Vùng gò mới có vị trí số một.|Tên gọi "Tân Sơn Nhất" có thể hiểu là vùng gò mới, có vị trí số một hoặc trọng yếu nhất trong khu vực.|3.19|66.684
Phường Tân Hòa|Phường 6, 8, 9 (Tân Bình)|356A Bắc Hải|Vùng đất mới cộng đồng hòa thuận.|Tên gọi "Tân Hòa" mang ý nghĩa vùng đất mới, nơi cộng đồng cư dân gắn bó, hòa thuận, cùng nhau dựng xây cuộc sống no ấm.|1.47|69.946
Phường Bảy Hiền|Phường 10, 11, 12 (Tân Bình)|1129/20 Lạc Long Quân|Ghi nhớ một người hiền đức tại địa phương.|Tên gọi "Bảy Hiền" xuất phát từ tên riêng của một người sống tại khu vực, được nhân dân kính trọng, ghi nhớ đặt thành tên địa phương.|2.87|110.754
Phường Tân Bình|Phường 13, 14, một phần 15 (Tân Bình)|387A Trường Chinh|Ý nghĩa vùng đất mới yên bình.|Tên gọi "Tân Bình" ra đời trong quá trình mở mang bờ cõi của chúa Nguyễn, mang ý nghĩa vùng đất mới yên bình, gửi gắm khát vọng an cư của những lưu dân đi khai phá miền đất hoang sơ và gợi nhớ cội nguồn của người di dân xa xứ.|2.21|87.854
Phường An Phú Đông|An Phú Đông, một phần Thạnh Lộc|12 Vườn Lài|Nét thanh bình của vùng đất phương Đông.|Tên gọi "An Phú Đông" vừa gợi nét thanh bình, sung túc của vùng đất phương Đông, vừa phản ánh khát vọng an cư, lập nghiệp và phát triển bền vững của cộng đồng nơi đây, từ thuở mở đất cho đến hôm nay.|14.59|129.257
Phường An Lạc|Bình Trị Đông B, An Lạc A, An Lạc|521 Kinh Dương Vương|Ước nguyện sống an vui, sung túc.|Cái tên "An Lạc" không chỉ là lời nhắc về ước nguyện sống an vui, sung túc mà còn là niềm tin vào một tương lai gắn kết, nơi cộng đồng chung tay xây dựng vùng đất tràn đầy sức sống và những cơ hội mới|10.472|162.695
Phường Bình Tân|Bình Hưng Hòa B, Bình Trị Đông A, Tân Tạo|43 đường số 16|Ước vọng về một vùng đất mới an lành.|Tên gọi "Bình Tân" không chỉ đơn thuần là sự ghép lại của những chữ quen thuộc từ các địa danh cũ, mà còn gửi gắm ước vọng về một vùng đất mới an lành, thịnh vượng.|11.293|137.234
Phường Tân Tạo|Xã Tân Kiên, một phần phường Tân Tạo A, Tân Tạo|1409 Tỉnh lộ 10|Miền đất mới được kiến tạo.|Tên gọi "Tên gọi 'Tân Tạo' mang ý nghĩa về một miền đất mới được kiến tạo, không ngừng đổi mới, vừa giữ hồn quê mộc mạc, vừa khoác lên dáng vẻ hiện đại, phát triển.|14.665|113.941
Phường Bình Trị Đông|Bình Trị Đông, BHH A, BTĐ A|162 Mã Lò|Gợi lên hình ảnh cộng đồng yên hòa.|Tên gọi "Bình Trị Đông" không chỉ phản ánh vị trí địa lý về vùng đất phía Đông được quản lý ổn định, mà còn gợi lên hình ảnh một cộng đồng yên hòa, bền vững, nơi cư dân cùng chung tay vun đắp một cuộc sống trù phú, an lành.|7.152|149.400
Phường Bình Hưng Hòa|Bình Hưng Hòa, một phần Sơn Kỳ, BHH A|621 Tân Kỳ Tân Quý|Vùng đất yên lành, hưng thịnh.|9.439|186.857
Phường Gia Định|Phường 1, 2, 7, 17 (Bình Thạnh)|98 Lê Văn Duyệt|Gia là mở rộng, định là định cư.|2.76|120.310
Phường Bình Thạnh|Phường 12, 14, 26 (Bình Thạnh)|6 Phan Đăng Lưu|Hàm chứa ước vọng yên bình, thịnh vượng.|3.32|117.497
Phường Bình Lợi Trung|Phường 5, 11, 13 (Bình Thạnh)|133 Nguyễn Văn Đậu|Vùng đất trung tâm, yên bình phát triển.|3.89|102.084
Phường Thạnh Mỹ Tây|Phường 19, 22, 25 (Bình Thạnh)|85/16 Phạm Viết Chánh|Vùng đất phồn thịnh tốt đẹp ở phía Tây.|4.4|152.371
Phường Bình Quới|Phường 27, 28 (Bình Thạnh)|Số 1 khu hành chính Thanh Đa|Vùng đất quý giá, yên bình, vững bền.|6.34|36.019
Phường Hạnh Thông|Phường 1, 3 (Gò Vấp)|306 Nguyễn Văn Nghi|Hạnh phúc, ấm no, hanh thông.|3.37|127.135
Phường An Nhơn|Phường 5, 6 (Gò Vấp)|1C Nguyễn Văn Lượng|Vùng đất yên bình, nhân hậu.|3.23|96.717
Phường Gò Vấp|Phường 10, 17 (Gò Vấp)|332 Quang Trung|Vùng gò cao có nhiều cây Vắp xưa.|2.81|99.629
Phường An Hội Đông|Phường 15, 16 (Gò Vấp)|330 Thống Nhất|Vùng đất hội tụ bình yên nơi phía Đông.|3.29|112.067
Phường Thông Tây Hội|Phường 8, 11 (Gò Vấp)|175 Nguyễn Văn Khối|Ước vọng vùng đất mở mang, kết nối.|3.24|118.826
Phường An Hội Tây|Phường 12, 14 (Gò Vấp)|397 Phan Huy Ích|Vùng đất hội tụ bình yên nơi phía Tây.|3.79|115.989
Phường Đức Nhuận|Phường 4, 5, 9 (Phú Nhuận)|744 Nguyễn Kiệm|Đức độ làm đẹp bản thân.|2.16|71.848
Phường Cầu Kiệu|Phường 1, 2, 7, một phần 15 (Phú Nhuận)|458 Phan Xích Long|Bắt nguồn từ xóm trồng Kiệu xưa.|1.23|77.995
Phường Phú Nhuận|Phường 8, 10, 11, 13, một phần 15 (Phú Nhuận)|159 Nguyễn Văn Trỗi|Ý nghĩa vùng đất sung túc, thịnh vượng.|1.46|65.244
Phường Tân Sơn Hòa|Phường 1, 2, 3 (Tân Bình)|291 Lê Văn Sỹ|Vùng đất gò cao khô ráo ổn định.|2.61|58.783
Phường Tân Sơn Nhất|Phường 4, 5, 7 (Tân Bình)|25/4-6 Hoàng Việt|Vùng gò mới có vị trí số một.|3.19|66.684
Phường Tân Hòa|Phường 6, 8, 9 (Tân Bình)|356A Bắc Hải|Vùng đất mới cộng đồng hòa thuận.|1.47|69.946
Phường Bảy Hiền|Phường 10, 11, 12 (Tân Bình)|1129/20 Lạc Long Quân|Ghi nhớ một người hiền đức tại địa phương.|2.87|110.754
Phường Tân Bình|Phường 13, 14, một phần 15 (Tân Bình)|387A Trường Chinh|Ý nghĩa vùng đất mới yên bình.|2.21|87.854
Phường Tân Sơn|Phần còn lại phường 15 (Tân Bình)|822 Trường Chinh|Gợi nhớ thời kỳ khai phá gò đồi mới.|Tên "Tân Sơn" nghĩa là gò đồi mới, gợi nhớ thời kỳ khai phá, khi cư dân mở rộng vùng sinh sống về phía Tây Bắc Sài Gòn - Gia Định.|10.08|68.290
Phường Tây Thạnh|Phường Tây Thạnh, một phần Sơn Kỳ|200/12 Nguyễn Hữu Tiến|Kỳ vọng vùng đất phía Tây thịnh vượng.|Tên gọi "Tây Thạnh" hàm chứa sự kỳ vọng về một vùng đất nằm ở phía Tây, nơi không chỉ giàu tiềm năng phát triển kinh tế mà còn hội tụ những giá trị của sự thịnh vượng và sức sống mới, sung túc, văn minh.|4.00|81.828
Phường Tân Sơn Nhì|Phường Tân Sơn Nhì, Sơn Kỳ, Tân Quý, Tân Thành|48 Tân Quý|Địa hình gò cao mới khai phá thứ hai.|Tên gọi "Tân Sơn Nhì" bắt nguồn từ đặc điểm địa hình và cách đặt tên quen thuộc của cư dân Nam Bộ xưa. "Tân" nghĩa là mới khai phá, "Sơn" chỉ vùng gò cao, đất đai khô ráo, còn “Nhì” hàm ý phân biệt với Tân Sơn Nhất.|3.49|104.391
Phường Phú Thọ Hòa|Phú Thọ Hòa, một phần Tân Thành, Tân Quý|146 Độc Lập|Vùng đất sung túc, hòa thuận bền lâu.|Tên gọi "Phú Thọ Hòa" mang ý nghĩa vùng đất sung túc, hòa thuận bền lâu, phản ánh khát vọng về cuộc sống ấm no, gắn kết cộng đồng của những lớp người khai phá.|3.03|130.377
Phường Tân Phú|Phú Trung, Hòa Thạnh, một phần Tân Thới Hòa, Tân Thành|525 Âu Cơ|Ý nghĩa vùng đất mới trù phú.|Tên gọi "Tân Phú" hàm chứa ý nghĩa vùng đất mới trù phú, vừa mang nghĩa mới mẻ trong quá trình hình thành, vừa mang khát vọng sung túc, phát triển bền vững của cư dân.|2.52|89.059
Phường Phú Thạnh|Phường Hiệp Tân, Phú Thạnh, một phần Tân Thới Hòa|275 Nguyễn Sơn|Ý nghĩa vùng đất giàu có, thịnh vượng.|Tên gọi "Phú Thạnh" mang nghĩa vùng đất giàu có, thịnh vượng, không chỉ phản ánh sự trù phú của đất đai mà còn gợi lên khát vọng về một cộng đồng sung túc, đoàn kết and phát triển bền vững.|2.98|94.831
Phường Hiệp Bình|Hiệp Bình Chánh, Hiệp Bình Phước, một phần Linh Đông|721 Quốc lộ 13|Sự đồng lòng gắn kết xây dựng yên bình.|Tên gọi "Hiệp Bình" chất chứa ý nghĩa về sự đồng lòng, gắn kết của cư dân để cùng nhau xây dựng một cuộc sống yên bình, ổn định.|16.01|191.878
Phường Thủ Đức|Bình Thọ, Linh Chiểu, Trường Thọ, Linh Tây...|2 Nguyễn Công Trứ|Ghi nhớ công lao ông Tạ Dương Minh.|Tên gọi "Thủ Đức" đến nay vẫn còn nhiều giả thuyết. Có người cho rằng "Thủ" chỉ đòn canh hoặc chức vụ đứng đầu một thủ thời phong kiến, còn "Đức" là tên người.|8.81|120.738
Phường Tam Bình|Phường Bình Chiểu, Tam Phú, Tam Bình|707 Tỉnh lộ 43|Biểu tượng của tinh thần hợp nhất ba làng.|Tên gọi "Tam Bình" không chỉ gợi nhớ về sự hợp nhất của ba làng trước đây, mà còn là biểu tượng của tinh thần đoàn kết, hòa thuận và khát vọng chung tay vun đắp một cuộc sống yên bình, bền vững qua bao thế hệ.|10.71|146.569
Phường Linh Xuân|Phường Linh Trung, Linh Xuân, một phần Linh Tây|1262 Kha Vạn Cân|Ý nghĩa tốt lành, mùa xuân bất tận.|Tên gọi "Linh Xuân" mang ý nghĩa tốt lành, chan chứa vượng khí, gợi hình ảnh mùa xuân bất tận, đem đến may mắn và sức sống bền bỉ cho cư dân.|12.29|153.725
Phường Tăng Nhơn Phú|Tân Phú, Hiệp Phú, Tăng Nhơn Phú A, B|29 Lê Văn Việt|Ước vọng vùng đất ngày càng phát triển.|Tên gọi "Tăng Nhơn Phú" gửi gắm ước vọng về một vùng đất ngày càng phát triển, nơi con người nhân hậu, cộng đồng gắn bó, đời sống vật chất và tinh thần đều sung túc.|16.509|181.317
Phường Long Bình|Long Bình, một phần phường Long Thạnh Mỹ|325 Nguyễn Văn Tăng|Ước vọng miền đất bình yên rồng ngự.|Tên gọi "Long Bình" mang ước vọng về một miền đất bình yên, nơi rồng trú ngụ, biểu trưng cho sự trường tồn, thịnh vượng và phát triển bền vững.|29.43|100.760
Phường Long Phước|Trường Thạnh, Long Phước|239 Khu phố Long Thuận|Niềm tin về miền đất rồng ngự ban phúc.|Tên gọi "Long Phước" gửi gắm niềm tin về miền đất rồng ngự, mang lại phúc lành, bình an và tài lộc cho con người.|34.29|46.902
Phường Long Trường|Phường Phú Hữu, Long Trường|893 Nguyễn Duy Trinh|Ước vọng vùng đất thịnh vượng lâu bền.|Tên gọi "Long Trường" gửi gắm ước vọng của người dân về một miền đất thịnh vượng lâu bền, nơi cộng đồng an cư, lạc nghiệp, đời sống sung túc.|24.49|71.026
Phường Cát Lái|Phường Thạnh Mỹ Lợi, Cát Lái|441A Nguyễn Thị Định|Nơi tụ họp xưa của lái buôn sông nước.|Tên gọi ban đầu là "Cát Lái", có nghĩa là nơi tụ họp của các lái buôn. Qua bao mùa nước lớn, nước ròng, âm sắc của hai chữ ấy trong lời ăn tiếng nói dân gian dần biến đổi.|19.65|56.614
Phường Bình Trưng|Bình Trưng Đông, Tây, một phần An Phú (Thủ Đức)|8 Hồ Thị Nhung|Vùng đất yên bình, thái hòa rạng danh.|Tên gọi "Bình Trưng" mang ý nghĩa vùng đất yên bình, thái hòa và rạng danh. Cái tên vừa là lời nhắc nhở về quá khứ oanh liệt, vừa là biểu tượng của khát vọng vươn lên.|14.82|108.139
Phường Phước Long|Phường Phước Bình, Phước Long A, B|616 Đỗ Xuân Hợp|Gợi ước vọng miền đất phúc lành.|Tên gọi "Phước Long" gửi gắm ước vọng về miền đất phúc lành, thịnh vượng, ổn định, nơi người dân có cuộc sống ấm no và niềm tin vào tương lai bền vững.|9.23|123.442
Phường An Khánh|Thủ Thiêm, An Lợi Đông, Thảo Điền, An Khánh|171/1 Lương Định Của|Gợi ảnh miền đất thanh bình hạnh phúc.|Tên gọi "An Khánh" gợi lên hình ảnh một miền đất thanh bình, nơi con người tìm thấy niềm vui, sự an cư và hạnh phúc.|15.33|73.629
Phường Đông Hòa|Phường Bình An, Bình Thắng, Đông Hòa|153 Quốc lộ 1K|Vùng đất phía Đông hòa thuận.|Tên gọi "Đông Hòa" nghĩa là vùng đất phía Đông hòa thuận, như lời gửi gắm về một cộng đồng đoàn kết, gắn bó.|21.893|132.056
Phường Dĩ An|Phường An Bình, Dĩ An, một phần Tân Đông Hiệp|Đường số 10 Dĩ An|Ý nghĩa là nơi đã an cư ổn định.|Tên gọi "Dĩ An" mang ý nghĩa là nơi đã an cư, vùng đất yên ổn, phản ánh ước vọng của cư dân thuở khai hoang về một chốn định cư thanh bình.|21.375|227.817
Phường Tân Đông Hiệp|Tân Bình, một phần Thái Hòa, Tân Đông Hiệp|880 Nguyễn Thị Minh Khai|Cộng đồng gắn kết phương Đông.|Tên gọi "Tân Đông Hiệp" mang ý nghĩa một vùng đất mới ở phương Đông, nơi cộng đồng gắn kết, hòa hợp cùng dựng xây cuộc sống sung túc.|21.446|100.243
Phường An Phú|An Phú (Thuận An), một phần Bình Chuẩn|Đường ĐT743 An Phú|Hàm ý bình an, thịnh vượng.|Tên gọi "An Phú" mang hàm ý bình an, thịnh vượng, phản chiếu khát vọng về một cuộc sống sung túc, yên ổn của cư dân bao đời.|16.851|162.930
Phường Bình Hòa|Phường Bình Hòa và một phần Vĩnh Phú|Đường ĐT743C Bình Hòa|Vùng đất yên bình, hòa thuận.|Tên gọi "Bình Hòa" mang ý nghĩa vùng đất yên bình, nơi cộng đồng gắn kết trong tinh thần hòa thuận.|18.493|120.035
Phường Lái Thiêu|Phường Bình Nhâm, Lái Thiêu, một phần Vĩnh Phú|Đường Phan Đình Phùng|Bến sông ghe thuyền giao thương.|Tên gọi "Lái Thiêu" với từ "Lái" vốn chỉ người lái thuyền, còn Thiêu là tên của một người có công khai khẩn vùng bến sông này.|15.22|56.321
Xã Bình Chánh|Xã Tân Quý Tây, Bình Chánh, An Phú Tây|345 Trịnh Như Khuê|Miền đất yên bình, sống chính trực.|Tên gọi "Bình Chánh" mang ý nghĩa về một miền đất yên bình, nơi con người sống chính trực, nhân hậu.|21.33|76.187
Xã Hưng Long|Xã Đa Phước, Qui Đức, Hưng Long|564 Đoàn Nguyễn Tuấn|Ý nghĩa hưng thịnh, trường tồn.|"Hưng Long" mang ý nghĩa hưng thịnh và trường tồn, biểu trưng cho khát vọng về một vùng đất không ngừng phát triển, mang lại cuộc sống ấm no cho cư dân.|35.54|71.504
Xã Bình Hưng|Xã Phong Phú, Bình Hưng, Phường 7 (Q.8)|A10/26A đường số 10|Kỳ vọng yên bình hưng thịnh lâu dài.|Tên gọi "Bình Hưng" gửi gắm kỳ vọng về một vùng đất luôn bình yên và hưng thịnh lâu dài.|32.4|183.535
Xã Bình Khánh|Xã Tam Thôn Hiệp, Bình Khánh, An Thới Đông|Ấp Bình An 1|Ý nghĩa vùng đất yên bình trù phú.|Tên gọi "Bình Khánh" mang ý nghĩa vùng đất yên bình và trù phú, nơi hội tụ của sự an lành.|158.28|31.403
Xã An Thới Đông|Xã Lý Nhơn, môt phần An Thới Đông|Ấp An Hòa 1|Phía Đông thanh bình, an cư.|"An Thới Đông" có thể hiểu là vùng đất phía Đông luôn thanh bình, thuận lợi cho việc an cư lạc nghiệp.|257.84|18.413
Xã Cần Giờ|Xã Long Hòa, Thị trấn Cần Thạnh|48 đường Lương Văn Nho|Phát triển từ bến sông Kan Cho xưa.|Tên gọi "Cần Giờ" có nguồn gốc từ tiếng Khmer "Kan Cho", nghĩa là bến sông, bến nước. Qua thời gian, người Việt đã Việt hóa thành "Cần Giờ", mang hơi thở của vùng đất rừng ngập mặn bao la.|157.01|22.052
Xã Củ Chi|Xã Tân Phú Trung, Tân Thông Hội, PV An|342 Phan Văn Khải|Sức sống kiên cường miền đất Củ Chi.|Tên gọi "Củ Chi" bắt nguồn từ loài cây Củ Chi vốn mọc rất nhiều trên vùng đất này. Cái tên không chỉ là một địa danh mà còn là biểu tượng của sức sống kiên cường, bền bỉ của con người và mảnh đất thép thành đồng.|64.87|128.611
Xã Tân An Hội|Thị trấn Củ Chi, Xã Phước Hiệp, Tân An Hội|77 Tỉnh lộ 8|Nơi hội tụ với những điều bình an.|"Tân An Hội" mang ý nghĩa là nơi hội tụ mới với những điều bình an, tốt đẹp.|53.5|84.342
Xã Thái Mỹ|Xã Trung Lập Thượng, Phước Thạnh, Thái Mỹ|712 Phan Văn Khải|Ý nghĩa sự thịnh vượng, tốt đẹp.|Tên gọi "Thái Mỹ" mang ý nghĩa về sự thịnh vượng, tốt đẹp và thanh bình.|62.44|49.862
Xã An Nhơn Tây|Xã Phú Mỹ Hưng, An Phú, An Nhơn Tây|1407 Tỉnh lộ 7|Vùng đất thanh bình, nhân hậu.|"An Nhơn Tây" hàm chứa ý nghĩa về một vùng đất thanh bình, nhân đức.|77.69|40.896
Phường Thới Hòa|Nguyên trạng|Khu phố 3A Bến Cát|Vùng thịnh vượng, hòa thuận lâu dài.|"Thới Hòa" mang ý nghĩa về một vùng đất luôn thịnh vượng and hòa thuận lâu dài.|13.67|25.324
Phường Vũng Tàu|Phường 1, 2, 3, 4, 5, Thắng Nhì, Thắng Tam|89 Lý Thường Kiệt|Vùng vịnh tàu bè neo đậu tránh bão.|Tên gọi "Vũng Tàu" xuất phát từ đặc điểm địa lý là một vùng vịnh kín gió, nơi tàu bè thường xuyên neo đậu để tránh bão và giao thương.|16.86|117.413
Phường Tam Thắng|Phường 7, 8, 9, Nguyễn An Ninh|603 Nguyễn An Ninh|Ghi nhớ 3 đội quân bảo vệ vùng.|Tên gọi "Tam Thắng" mang ý nghĩa ghi nhớ công lao của ba đội quân (thắng nhất, thắng nhì, thắng tam) đã có công bảo vệ và xây dựng vùng đất này.|11.76|86.420
Phường Rạch Dừa|Phường 10, Thắng Nhất, Rạch Dừa|219/28 Lưu Chí Hiếu|Con rạch nhỏ trồng nhiều dừa.|Tên gọi "Rạch Dừa" bắt nguồn từ hình ảnh con rạch nhỏ chảy qua vùng đất vốn trồng rất nhiều dừa.|19.70|76.281
Phường Phước Thắng|Phường 11, 12 (Vũng Tàu)|7A Nguyễn Gia Thiều|Phúc lành chiến thắng điều hung.|Tên gọi "Phước Thắng" mang ý nghĩa về sự phúc lành và chiến thắng, thể hiện khát vọng của cư dân về một cuộc sống bình an, vượt qua mọi khó khăn.|47.35|52.589
Phường Long Hương|Xã Tân Hưng, Kim Dinh, Long Hương|Trình Đình Thảo|Hương thơm phát triển vươn xa.|Tên gọi "Long Hương" gợi nhắc về hương thơm và sự thịnh vượng lan tỏa, phát triển bền vững của vùng đất rồng.|41.22|31.457
Phường Bà Rịa|Phước Trung, Phước Nguyên, Long Toàn, Hưng|221 Cách mạng Tháng Tám|Di sản khai phá xứ Bà Rịa xưa.|Tên gọi "Bà Rịa" gắn liền với công lao khai phá của bà Nguyễn Thị Rịa, một bậc tiền nhân có công đầu trong việc khẩn hoang, lập ấp tại vùng đất này.|15.55|52.265
Phường Tam Long|Phường Long Tâm, Xã Hòa Long, Long Phước|Tỉnh lộ 52, Ấp Đông|Ba thế rồng hội tụ linh thiêng.|Tên gọi "Tam Long" mang ý nghĩa về sự hội tụ của ba thế rồng, biểu trưng cho sự linh thiêng, sức mạnh và thịnh vượng.|34.70|41.130
Phường Tân Hải|Phường Tân Hòa, Tân Hải|QL 51, thôn Láng Cát|Gắn liền đặc trưng vùng ven biển.|Tên gọi " Tân Hải" mang ý nghĩa vùng đất mới ven biển, gắn liền với đặc trưng địa lý và khát vọng chinh phục biển khơi của cư dân.|51.86|30.297
Phường Tân Phước|Phường Phước Hòa, Tân Phước|2102 Đường Độc lập|Ước vọng may mắn và thịnh vượng.|Tên gọi "Tân Phước" gửi gắm ước nguyện về một vùng đất mới luôn gặp nhiều may mắn, phúc lành và thịnh vượng.|83.62|29.363
Phường Phú Mỹ|Phường Phú Mỹ, Mỹ Xuân|412 Độc lập Phú Mỹ|Ý nghĩa vùng đất giàu đẹp.|Tên gọi "Phú Mỹ" mang ý nghĩa vùng đất giàu có và tốt đẹp, thể hiện khát vọng về một cuộc sống sung túc, văn minh.|70.92|78.641
Phường Tân Thành|Phường Hắc Dịch, Xã Sông Xoài|152 đường Bình Giã|Vùng đất mới ổn định phát triển.|Tên gọi "Tân Thành" mang ý nghĩa vùng đất mới được xây dựng ổn định và không ngừng phát triển.|61.63|33.943
Xã Vĩnh Lộc|Xã Vĩnh Lộc A, một phần Phạm Văn Hai|F7/16 Hương lộ 80|Vùng đất giàu lộc phúc trường tồn.|"Vĩnh Lộc" mang ý nghĩa là vùng đất của sự lộc phúc trường tồn, mãi mãi thịnh vượng.|30.58|167.042
Xã Tân Vĩnh Lộc|Xã Vĩnh Lộc B, Phạm Văn Hai, Tân Tạo|2206 đường Trần Văn Giàu|Kế thừa truyền thống vùng đất cũ.|"Tân Vĩnh Lộc" mang ý nghĩa sự kế thừa và phát triển mới từ truyền thống lộc phúc của vùng đất cũ.|34.02|164.278
Xã Bình Lợi|Xã Lê Minh Xuân, Bình Lợi|1905 đường Trần Văn Giàu|Vùng đất bình yên, nhiều lợi ích.|Tên gọi "Bình Lợi" phản ánh khát vọng về một cuộc sống yên bình và mang lại nhiều lợi ích cho cộng đồng.|54.17|41.180
Xã Tân Nhựt|Thị trấn Tân Túc, Tân Nhựt, Tân Tạo A|79 đường Tân Túc|Ánh bình minh khởi đầu mới.|"Tân Nhựt" gợi hình ảnh về ánh nhật quang (ánh mặt trời) của một ngày mới, một khởi đầu tươi sáng và tràn đầy hy vọng.|43.48|115.721
Xã Bàu Lâm|Xã Tân Lâm, Bàu Lâm|Ấp 2 Đông Bàu Lâm|Bàu nước nằm trong rừng rậm.|Tên gọi bắt nguồn từ hình ảnh bàu nước nằm sâu trong rừng rậm, gắn liền với thuở sơ khai lập ấp.|123.83|22.567
Đặc khu Côn Đảo|Huyện Côn Đảo|28 đường Tôn Đức Thắng|Tiếng Mã Lai Hòn Bí - Pulau Kundur.|Tên gọi "Côn Đảo" có nguồn gốc từ tiếng Mã Lai "Pulau Kundur", nghĩa là Hòn Bí. Người phương Tây đọc thành Poulo Condore, and người Việt gọi là Côn Lôn hay Côn Đảo.|75.79|6.143
Xã Bình Châu|Nguyên trạng|Ấp Láng Găng Bình Châu|Quý như châu báu giữa thiên nhiên.|"Bình Châu" mang ý nghĩa vùng đất quý giá như châu báu giữa thiên nhiên hiền hòa.|37.930|79.601
Xã Hòa Hiệp|Nguyên trạng|Xã Hòa Hiệp Xuyên Mộc|Nếp sống hòa thuận bao đời.|" Hòa Hiệp" mang ý nghĩa về nếp sống hòa thuận, hiệp lực của cộng đồng qua nhiều thế hệ.|56.50|17.767
Xã Long Sơn|Nguyên trạng|Thôn 1 Xã Long Sơn|Long ẩn sơn, hổ phục thủy.|Tên gọi "Long Sơn" gợi hình ảnh "long ẩn sơn, hổ phục thủy", thể hiện địa thế linh thiêng, vững chãi của vùng đất này.|99.28|25.995
Xã Thạnh An|Nguyên trạng|Ấp Thạnh Bình Cần Giờ|Cốt cách kiên cường trước biển cả.|Tên gọi "Thạnh An" phản ánh cốt cách kiên cường, bền bỉ của con người trước sóng gió biển cả and ước vọng về một cuộc sống an yên.|87.06|26.054
Phường Thới Hòa|Nguyên trạng|Khu phố 3A Bến Cát|Vùng thịnh vượng, hòa thuận lâu dài.|"Thới Hòa" mang ý nghĩa về một vùng đất luôn thịnh vượng and hòa thuận lâu dài.|136.717|25.324
Phường Vũng Tàu|Phường 1, 2, 3, 4, 5, Thắng Nhì, Thắng Tam|89 Lý Thường Kiệt|Vùng vịnh tàu bè neo đậu tránh bão.|Tên gọi "Vũng Tàu" xuất phát từ đặc điểm địa lý là một vùng vịnh kín gió, nơi tàu bè thường xuyên neo đậu để tránh bão và giao thương.|16.86|117.413
Phường Tam Thắng|Phường 7, 8, 9, Nguyễn An Ninh|603 Nguyễn An Ninh|Ghi nhớ 3 đội quân bảo vệ vùng.|Tên gọi "Tam Thắng" mang ý nghĩa ghi nhớ công lao của ba đội quân (thắng nhất, thắng nhì, thắng tam) đã có công bảo vệ và xây dựng vùng đất này.|11.76|86.420
Phường Rạch Dừa|Phường 10, Thắng Nhất, Rạch Dừa|219/28 Lưu Chí Hiếu|Con rạch nhỏ trồng nhiều dừa.|Tên gọi "Rạch Dừa" bắt nguồn từ hình ảnh con rạch nhỏ chảy qua vùng đất vốn trồng rất nhiều dừa.|19.70|76.281
Phường Phước Thắng|Phường 11, 12 (Vũng Tàu)|7A Nguyễn Gia Thiều|Phúc lành chiến thắng điều hung.|Tên gọi "Phước Thắng" mang ý nghĩa về sự phúc lành và chiến thắng, thể hiện khát vọng của cư dân về một cuộc sống bình an, vượt qua mọi khó khăn.|47.35|52.589
Phường Long Hương|Xã Tân Hưng, Kim Dinh, Long Hương|Trình Đình Thảo|Hương thơm phát triển vươn xa.|Tên gọi "Long Hương" gợi nhắc về hương thơm và sự thịnh vượng lan tỏa, phát triển bền vững của vùng đất rồng.|41.22|31.457
Phường Bà Rịa|Phước Trung, Phước Nguyên, Long Toàn, Hưng|221 Cách mạng Tháng Tám|Di sản khai phá xứ Bà Rịa xưa.|Tên gọi "Bà Rịa" gắn liền với công lao khai phá của bà Nguyễn Thị Rịa, một bậc tiền nhân có công đầu trong việc khẩn hoang, lập ấp tại vùng đất này.|15.55|52.265
Phường Tam Long|Phường Long Tâm, Xã Hòa Long, Long Phước|Tỉnh lộ 52, Ấp Đông|Ba thế rồng hội tụ linh thiêng.|Tên gọi "Tam Long" mang ý nghĩa về sự hội tụ của ba thế rồng, biểu trưng cho sự linh thiêng, sức mạnh và thịnh vượng.|34.70|41.130
Phường Tân Hải|Phường Tân Hòa, Tân Hải|QL 51, thôn Láng Cát|Gắn liền đặc trưng vùng ven biển.|Tên gọi "Tân Hải" mang ý nghĩa vùng đất mới ven biển, gắn liền với đặc trưng địa lý và khát vọng chinh phục biển khơi của cư dân.|51.86|30.297
Phường Tân Phước|Phường Phước Hòa, Tân Phước|2102 Đường Độc lập|Ước vọng may mắn và thịnh vượng.|Tên gọi "Tân Phước" gửi gắm ước nguyện về một vùng đất mới luôn gặp nhiều may mắn, phúc lành và thịnh vượng.|83.62|29.363
Phường Phú Mỹ|Phường Phú Mỹ, Mỹ Xuân|412 Độc lập Phú Mỹ|Ý nghĩa vùng đất giàu đẹp.|Tên gọi "Phú Mỹ" mang ý nghĩa vùng đất giàu có and tốt đẹp, thể hiện khát vọng về một cuộc sống sung túc, văn minh.|70.92|78.641
Phường Tân Thành|Phường Hắc Dịch, Xã Sông Xoài|152 đường Bình Giã|Vùng đất mới ổn định phát triển.|Tên gọi "Tân Thành" mang ý nghĩa vùng đất mới được xây dựng ổn định và không ngừng phát triển.|61.63|33.943
Xã Vĩnh Lộc|Xã Vĩnh Lộc A, một phần Phạm Văn Hai|F7/16 Hương lộ 80|Vùng đất giàu lộc phúc trường tồn.|"Vĩnh Lộc" mang ý nghĩa là vùng đất của sự lộc phúc trường tồn, mãi mãi thịnh vượng.|30.58|167.042
Xã Tân Vĩnh Lộc|Xã Vĩnh Lộc B, Phạm Văn Hai, Tân Tạo|2206 đường Trần Văn Giàu|Kế thừa truyền thống vùng đất cũ.|"Tân Vĩnh Lộc" mang ý nghĩa sự kế thừa và phát triển mới từ truyền thống lộc phúc của vùng đất cũ.|34.02|164.278
Xã Bình Lợi|Xã Lê Minh Xuân, Bình Lợi|1905 đường Trần Văn Giàu|Vùng đất bình yên, nhiều lợi ích.|Tên gọi "Bình Lợi" phản ánh khát vọng về một cuộc sống yên bình và mang lại nhiều lợi ích cho cộng đồng.|54.17|41.180
Xã Tân Nhựt|Thị trấn Tân Túc, Tân Nhựt, Tân Tạo A|79 đường Tân Túc|Ánh bình minh khởi đầu mới.|"Tân Nhựt" gợi hình ảnh về ánh nhật quang (ánh mặt trời) của một ngày mới, một khởi đầu tươi sáng và tràn đầy hy vọng.|43.48|115.721
Xã Bình Chánh|Xã Tân Quý Tây, Bình Chánh, An Phú Tây|345 Trịnh Như Khuê|Miền đất yên bình, sống chính trực.|21.33|76.187
Xã Hưng Long|Xã Đa Phước, Qui Đức, Hưng Long|564 Đoàn Nguyễn Tuấn|Ý nghĩa hưng thịnh, trường tồn.|35.54|71.504
Xã Bình Hưng|Xã Phong Phú, Bình Hưng, Phường 7 (Q.8)|A10/26A đường số 10|Kỳ vọng yên bình hưng thịnh lâu dài.|32.4|183.535
Xã Bình Khánh|Xã Tam Thôn Hiệp, Bình Khánh, An Thới Đông|Ấp Bình An 1|Ý nghĩa vùng đất yên bình trù phú.|158.28|31.403
Xã An Thới Đông|Xã Lý Nhơn, môt phần An Thới Đông|Ấp An Hòa 1|Phía Đông thanh bình, an cư.|257.84|18.413
Xã Cần Giờ|Xã Long Hòa, Thị trấn Cần Thạnh|48 đường Lương Văn Nho|Phát triển từ bến sông Kan Cho xưa.|157.01|22.052
Xã Củ Chi|Xã Tân Phú Trung, Tân Thông Hội, PV An|342 Phan Văn Khải|Sức sống kiên cường miền đất Củ Chi.|64.87|128.611
Xã Tân An Hội|Thị trấn Củ Chi, Xã Phước Hiệp, Tân An Hội|77 Tỉnh lộ 8|Nơi hội tụ với những điều bình an.|53.5|84.342
Xã Thái Mỹ|Xã Trung Lập Thượng, Phước Thạnh, Thái Mỹ|712 Phan Văn Khải|Ý nghĩa sự thịnh vượng, tốt đẹp.|62.44|49.862
Xã An Nhơn Tây|Xã Phú Mỹ Hưng, An Phú, An Nhơn Tây|1407 Tỉnh lộ 7|Vùng đất thanh bình, nhân hậu.|77.69|40.896
Xã Nhuận Đức|Xã Phạm Văn Cội, Trung Lập Hạ, Nhuận Đức|1A Bà Thiên|Nhuần thấm bởi đức hạnh.|62.05|40.239
Xã Phú Hòa Đông|Tân Thạnh Tây, Đông, Phú Hòa Đông|269 Tỉnh lộ 8|Vùng đất trù phú, chan hòa.|59.75|97.766
Xã Bình Mỹ|Xã Bình Mỹ, Hòa Phú, Trung An|1627 Tỉnh lộ 8|Hình ảnh vùng đất hiền hòa trù phú.|54.43|99.675
Xã Đông Thạnh|Xã Thới Tam Thôn, Nhị Bình, Đông Thạnh|250 Đặng Thúc Vịnh|Vùng đất phía Đông hưng thịnh.|30.166|187.785
Xã Hóc Môn|Phường Tân Hiệp, Tân Xuân, Hóc Môn|Số 01 Lý Thường Kiệt|Cây môn mọc trên con rạch xưa.|16.433|88.632
Xã Xuân Thới Sơn|Tân Thới Nhì, Xuân Thới Đông, Sơn|1A Lê Thị Kim|Ý nghĩa mùa xuân hưng thịnh.|35.211|96.621
Xã Bà Điểm|Xuân Thới Thượng, Trung Chánh, Bà Điểm|14/9 Phan Văn Hớn|Gắn với các giai thoại kháng chiến xưa.|27.361|192.230
Xã Nhà Bè|Thị trấn Nhà Bè, Phú Xuân, Phước Kiển...|330 Nguyễn Bình|Kết tre làm bè sinh hoạt trên sông.|27.10|156.540
Xã Hiệp Phước|Xã Nhơn Đức, Long Thới, Hiệp Phước|209 Nguyễn Văn Tạo|Ý nghĩa đoàn kết và phúc lành.|63.332|73.835
Xã Thường Tân|Xã Lạc An, Hiếu Liêm, Thường Tân|Ấp 4 Thường Tân|Vùng đất mới vững bền thịnh vượng.|127.763|21.238
Xã Bắc Tân Uyên|Thị trấn Tân Thành, Đất Cuốc, Tân Định|Khu phố 2 Bắc Tân Uyên|Phía Bắc huyện Tân Uyên xưa.|143.694|27.964
Xã Phú Giáo|Thị trấn Phước Vĩnh, An Bình, Tam Lập|02 đường Hùng Vương|Trù phú, giàu truyền thống tri thức.|192.833|42.739
Xã Phước Hòa|Xã Vĩnh Hòa, Phước Hòa, Tam Lập|Tổ 3, ấp Trảng Sắn|Phúc lành, hòa thuận, thịnh vượng.|128.067|42.470
Xã Phước Thành|Xã Tân Hiệp, An Thái, Phước Sang|Tổ 4, ấp Sa Dụp|Ước vọng vùng đất phúc lành thịnh vượng.|123.494|15.803
Xã An Long|Xã An Linh, Tân Long, An Long|Tổ 04, ấp Xóm Quạt|Hàm ý bình an và thịnh vượng.|100.045|17.906
Xã Trừ Văn Thố|Xã Trừ Văn Thố, Cây Trường II, Lai Uyên|Ấp ông Thanh|Tri ân Anh hùng Trừ Văn Thố.|76.556|24.533
Xã Bàu Bàng|Phần còn lại Thị trấn Lai Uyên|Khu phố Đồng Sổ Bàu Bàng|Vùng trũng mọc nhiều cây bàng.|84.089|42.219
Xã Long Hòa|Long Tân, Long Hòa, Minh Tân, Thạnh|Tổ 9, ấp Long Điền|Thịnh vượng, chân hòa, đoàn kết.|166.756|25.215
Xã Thanh An|Xã Thanh An, Định Hiệp, Tuyền, An Lập|Tổ 1, ấp Cần Giăng|Miền đất yên lành, thanh bình.|136.717|25.324
Xã Dầu Tiếng|TT Dầu Tiếng, Định An, Thành, Hiệp|Đường Hùng Vương Dầu Tiếng|Dấu mốc cây Dầu cổ thụ nổi tiếng.|182.685|39.056
Xã Minh Thạnh|Xã Minh Hòa, Minh Tân, Minh Thạnh|Tổ 3, ấp Hòa Cường|Ý nghĩa sáng rõ, thịnh vượng.|159.059|24.215
Xã Châu Pha|Các xã Tóc Tiên và Châu Pha|Thôn Châu Pha|Gò đồi xen kẽ sông suối Châu Đức.|65.64|25.438
Xã Long Hải|TT Long Hải, Phước Tỉnh, Phước Hưng|Xã Phước Tỉnh|Vùng biển linh thiêng trù phú.|27.93|109.149
Xã Long Điền|TT Long Điền, Xã Tam An|120 Dương Bạch Mai|Cánh đồng rồng ngự lâu đời.|51.44|48.048
Xã Phước Hải|TT Phước Hải, Xã Phước Hội|Xã Phước Hội Đất Đỏ|Vùng biển may mắn tốt lành.|70.44|43.615
Xã Đất Đỏ|TT Đất Đỏ, Long Tân, Láng Dài, Thọ|KP Hiệp Hòa Đất Đỏ|Sắc bazan màu mỡ trù phú.|119.77|43.862
Xã Nghĩa Thành|Các xã Đá Bạc, Nghĩa Thành|Đường số 6 Nghĩa Thành|Vùng đất nghĩa khí, kiên cường.|65.67|27.819
Xã Ngãi Giao|TT Ngãi Giao, Bình Ba, Suối Nghệ|70 Trần Hưng Đạo|Kết nối các dòng chảy văn hóa.|69.30|49.065
Xã Kim Long|TT Kim Long, Bàu Chinh, Láng Lớn|Ấp Liên Lộc Kim Long|Rồng vàng, giàu có, linh khí.|63.92|33.369
Xã Châu Đức|Các xã Cù Bị, Xà Bang|Ấp Liên Lộc Châu Đức|Trù phú, hiền hòa, nhân đức.|84.66|28.240
Xã Bình Giã|Bình Trung, Quảng Thành, Bình Giã|Tổ 2, ấp Vĩnh Bình|Chuyển hoá từ đồng hoang văn minh.|66.96|34.262
Xã Xuân Sơn|Suối Rao, Sơn Bình, Xuân Sơn|Tổ 10, thôn Xuân Tân|Thiên nhiên núi non tươi đẹp.|73.81|27.368
Xã Hồ Tràm|TT Phước Bửu, Phước Tân, Thuận|151 quốc lộ 55|Hàng cây tràm che chở làng chài.|94.51|51.895
Xã Xuyên Mộc|Bông Trang, Bưng Riềng, Xuyên Mộc|Ấp Trang Hoàng|Sáp nhập từ làng Xương Mộc xưa.|102.96|26.917
Xã Hòa Hội|Hòa Hưng, Hòa Bình, Hòa Hội|Xã Hòa Bình Xuyên Mộc|Vùng đất đoàn kết, hội tụ.|136.27|36.174
Xã Bàu Lâm|Xã Tân Lâm, Bàu Lâm|Ấp 2 Đông Bàu Lâm|Bàu nước nằm trong rừng rậm.|123.83|22.567
Đặc khu Côn Đảo|Huyện Côn Đảo|28 đường Tôn Đức Thắng|Tiếng Mã Lai Hòn Bí - Pulau Kundur.|75.79|6.143
Xã Bình Châu|Nguyên trạng|Ấp Láng Găng Bình Châu|Quý như châu báu giữa thiên nhiên.|37.930|79.601
Xã Hòa Hiệp|Nguyên trạng|Xã Hòa Hiệp Xuyên Mộc|Nếp sống hòa thuận bao đời.|56.50|17.767
Xã Long Sơn|Nguyên trạng|Thôn 1 Xã Long Sơn|Long ẩn sơn, hổ phục thủy.|99.28|25.995
Xã Thạnh An|Nguyên trạng|Ấp Thạnh Bình Cần Giờ|Cốt cách kiên cường trước biển cả.|87.06|26.054
Phường Thới Hòa|Nguyên trạng|Khu phố 3A Bến Cát|Vùng thịnh vượng, hòa thuận lâu dài.|136.717|25.324`;

const parseAttributes = (): Record<string, WardAttribute> => {
  const lines = rawCsvData.trim().split('\n');
  const attributes: Record<string, WardAttribute> = {};
  
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length >= 7) {
      const name = parts[0].trim();
      attributes[name] = {
        name,
        merger: parts[1].trim(),
        headquarters: parts[2].trim(),
        history: parts[3].trim(),
        meaning: parts[4].trim(),
        area: parts[5].trim(),
        population: parts[6].trim(),
      };
    }
  });
  return attributes;
};

// Components
function InfoCard({ icon, label, value }: { icon: ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-900 leading-tight">{value}</p>
    </div>
  );
}

function DetailView({ feature, onClose }: { feature: MergedFeature | null, onClose: () => void }) {
  if (!feature) return null;

  const name = feature.properties.Name || feature.properties.Ten_Xa;
  const details = feature.properties.details;

  return (
    <div className="flex flex-col h-full bg-white relative overflow-y-auto">
      {/* Block 0: Fixed Navigation */}
      <div className="sticky top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b flex items-center px-6 z-[2500]">
        <button 
          onClick={onClose}
          className="text-xs font-black text-[#003366] flex items-center gap-3 hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> QUAY LẠI BẢN ĐỒ TỔNG QUAN
        </button>
      </div>
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {/* Block 1: Header & Mini Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-12">
            <div className="h-64 w-full bg-slate-900 rounded-3xl overflow-hidden relative shadow-2xl mb-12">
              <img 
                src="https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?auto=format&fit=crop&q=80&w=1200" 
                alt="Urban Panorama" 
                className="w-full h-full object-cover opacity-60"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col justify-end p-10">
                <span className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Hồ sơ đơn vị hành chính</span>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">{name}</h1>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 h-[400px]">
            <div className="h-full w-full bg-slate-100 rounded-3xl border-4 border-white shadow-xl overflow-hidden relative">
              <MapContainer 
                key={`detail-map-${name}`}
                center={[10.76, 106.66]} 
                zoom={14} 
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON 
                  data={feature as any} 
                  style={{ fillColor: '#003366', fillOpacity: 0.4, color: '#003366', weight: 4 }}
                  onEachFeature={(f, layer) => {
                    setTimeout(() => {
                      const l = layer as L.Polyline;
                      const map = (l as any)._map;
                      if (map) {
                        map.fitBounds(l.getBounds(), { padding: [40, 40] });
                      }
                    }, 400);
                  }}
                />
              </MapContainer>
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm z-[1000]">Ward Focus View</div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-widest border-l-4 border-[#f27d26] pl-4">Giới thiệu tổng quan</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Đơn vị hành chính <b>{name}</b> được hình thành từ việc sáp nhập <b>{details?.merger || 'các đơn vị cũ'}</b>. 
                Dưới đây là các thông số hạ tầng và lịch sử biến động địa giới hành chính của đơn vị.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">GIS ID: {feature.id || 'N/A'}</span>
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">TYPE: BOUNDARY_POLY</span>
                <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">DATUM: WGS84</span>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <InfoCard icon={<MapPin className="text-[#f27d26]" />} label="Trạng thái" value="Đang hoạt động" />
          <InfoCard icon={<Building className="text-[#003366]" />} label="Trụ sở hành chính" value={details?.headquarters || 'Đang cập nhật'} />
          <InfoCard icon={<History className="text-blue-600" />} label="Dân số (Người)" value={details?.population || 'Đang thống kê'} />
          <InfoCard icon={<ExternalLink className="text-emerald-600" />} label="Diện tích (km²)" value={details?.area || 'Đang tính toán'} />
        </div>

        {/* Block 3: Meaning Section */}
        <div className="mb-16">
          <div className="bg-blue-50 border border-blue-100 rounded-[3rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-5 rotate-12">
              <Search className="w-96 h-96" />
            </div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="text-white w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Ý nghĩa tên gọi</h2>
            </div>
            <div className="prose prose-slate max-w-none relative z-10">
              <p className="text-xl leading-relaxed text-slate-700 font-medium italic">
                "{details?.meaning || 'Dữ liệu về ý nghĩa tên gọi đang được cập nhật từ các nguồn tư liệu lịch sử và ngôn ngữ dân gian...'}"
              </p>
            </div>
          </div>
        </div>

        {/* Block 4: History Section */}
        <div className="mb-16">
          <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-5 rotate-12">
              <History className="w-96 h-96" />
            </div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg">
                <History className="text-white w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Diễn trình sáp nhập & Lịch sử</h2>
            </div>
            <div className="prose prose-slate max-w-none relative z-10">
              <p className="text-xl leading-relaxed text-slate-700 font-medium">
                {details?.history || 'Dữ liệu lịch sử sáp nhập đang được rà soát và đối chiếu với các văn bản pháp quy từ lưu trữ địa giới hành chính...'}
              </p>
            </div>
          </div>
        </div>

        {/* Block 4: Media Gallery */}
        <div className="grid grid-cols-1 gap-10">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#f27d26] rounded-full"></span>
              Thư viện ảnh địa bàn
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img src="https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img src="https://images.unsplash.com/photo-1596402184320-417d7178b2cd?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img src="https://images.unsplash.com/photo-1496560230580-ed31f4a9ea28?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="aspect-[4/3] bg-slate-950 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="text-xl font-black">+24</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Xem thêm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#003366] py-16 px-6 text-center text-white/40">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 bg-white rounded-xl mb-6 flex items-center justify-center overflow-hidden shadow-2xl">
            <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png" alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
          </div>
          <p className="font-black text-white text-sm uppercase tracking-[0.2em]">Trường Đại học Kinh tế - Luật, ĐHQG-HCM</p>
          <p className="text-[11px] mt-2 opacity-50 uppercase font-bold tracking-widest">Digital Administrative Blueprint • GIS Laboratory</p>
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [geoData, setGeoData] = useState<any>(null);
  const [attributes, setAttributes] = useState<Record<string, WardAttribute>>({});
  const [selectedWard, setSelectedWard] = useState<MergedFeature | null>(null);
  const [view, setView] = useState<'map' | 'detail'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const attrData = parseAttributes();
    setAttributes(attrData);
    
    fetch('https://raw.githubusercontent.com/dtnhcmussh/chaothanhphomoi/main/HCM_Phuongxa_update.json')
      .then(res => res.json())
      .then(data => {
        const filteredFeatures = data.features
          .map((feature: any) => {
            const name = feature.properties.Name || feature.properties.Ten_Xa || feature.properties.name || feature.properties.TEN_PHUONG || 'Chưa rõ tên';
            const details = attrData[name] || {
              name,
              merger: 'Đang cập nhật',
              headquarters: 'Đang cập nhật',
              history: 'Chưa có thông tin lịch sử sáp nhập cụ thể.',
              meaning: 'Dữ liệu đang được cập nhật...',
              area: 'Đang tính toán',
              population: 'Đang thống kê'
            };
            
            return {
              ...feature,
              properties: {
                ...feature.properties,
                Name: name,
                details,
                color: getRandomColor()
              }
            };
          })
          .filter((f: any) => f !== null);

        const processedData = {
          type: 'FeatureCollection',
          features: filteredFeatures
        };

        setGeoData(processedData);
        (window as any).allWardsData = processedData.features.reduce((acc: any, f: any) => {
          acc[f.properties.Name] = f;
          return acc;
        }, {});
      })
      .catch(err => {
        console.error('Error fetching GeoJSON:', err);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoData || !searchQuery) return;

    const found = geoData.features.find((f: MergedFeature) => 
      (f.properties.Name || f.properties.Ten_Xa || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (found && mapRef.current) {
      const layer = L.geoJSON(found);
      mapRef.current.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
      setSelectedWard(found);
    }
  };

  useEffect(() => {
    (window as any).openDetailView = (name: string) => {
      setGeoData((current: any) => {
        if (!current) return current;
        const found = current.features.find((f: MergedFeature) => (f.properties.Name || f.properties.Ten_Xa) === name);
        if (found) {
          setSelectedWard(found);
          setView('detail');
          const root = document.getElementById('root');
          if (root) root.scrollIntoView({ behavior: 'auto' });
        }
        return current;
      });
    };
  }, []);

  return (
    <div className="h-full w-full font-sans bg-slate-50 overflow-hidden flex flex-col relative text-slate-900">
      {/* Top Branding Bar */}
      <header className="h-16 bg-[#003366] text-white flex items-center px-6 shadow-md z-[2000] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center overflow-hidden shadow-lg">
            <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png" alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-tight uppercase leading-none">Hệ thống Bản đồ Hành chính Mới</h1>
            <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider mt-1">Trường Đại học Kinh tế - Luật, ĐHQG-HCM</p>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center px-4 sm:px-12">
          <div className="relative w-full max-w-md group">
            <input 
              type="text" 
              list="ward-list"
              placeholder="Tìm kiếm phường xã hành chính mới..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-full py-2.5 px-12 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all placeholder:text-white/40 text-white"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
            <datalist id="ward-list">
              {geoData && geoData.features.map((f: any) => (
                <option key={f.properties.Name || f.id} value={f.properties.Name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[10px] font-black italic tracking-widest shrink-0">
          <span className="px-2 py-1 bg-[#f27d26] text-white rounded shadow-sm">GIS LIVE</span>
          <span className="opacity-50">VER 2024.1.0</span>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-slate-100">
        <AnimatePresence mode="wait">
          {view === 'map' ? (
            <motion.div 
              key="map-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none z-10" style={{ backgroundImage: 'radial-gradient(#003366 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

              <MapContainer 
                center={[10.762622, 106.660172]} 
                zoom={11} 
                className="h-full w-full"
                ref={mapRef}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                />
                {geoData && (
                  <GeoJSON
                    data={geoData}
                    style={(feature: any) => ({
                      fillColor: feature?.properties?.color || '#ebf8ff',
                      weight: 2,
                      opacity: 1,
                      color: 'white',
                      fillOpacity: 0.7
                    })}
                    onEachFeature={(feature: MergedFeature, layer: L.Layer) => {
                      const name = feature.properties.Name || feature.properties.Ten_Xa;
                      const details = feature.properties.details;

                      layer.bindTooltip(`<div class="custom-tooltip">${name}</div>`, {
                        permanent: false,
                        direction: 'auto',
                        sticky: true,
                        className: 'custom-tooltip'
                      });

                      layer.on({
                        mouseover: (e) => {
                          const l = e.target;
                          l.setStyle({ fillOpacity: 0.9, weight: 4, color: '#white' });
                        },
                        mouseout: (e) => {
                          const l = e.target;
                          l.setStyle({ fillOpacity: 0.7, weight: 2, color: 'white' });
                        },
                        click: (e) => {
                          const l = e.target;
                          const popupContent = document.createElement('div');
                          popupContent.className = 'p-5 bg-white min-w-[260px] shadow-2xl rounded-xl';
                          popupContent.innerHTML = `
                            <div class="mb-4">
                              <span class="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest border border-blue-100">Information Card</span>
                              <h3 class="text-xl font-black text-[#003366] mt-2 leading-none uppercase">${name}</h3>
                              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">📍 Đơn vị hành chính mới</p>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div class="col-span-2">
                                <p class="text-[9px] uppercase font-black text-slate-400 tracking-tight">Trụ sở hành chính</p>
                                <p class="text-[11px] text-slate-700 font-bold leading-tight">${details?.headquarters || 'Đang cập nhật'}</p>
                              </div>
                              <div>
                                <p class="text-[9px] uppercase font-black text-slate-400 tracking-tight">Dân số</p>
                                <p class="text-[11px] text-blue-700 font-black">${details?.population || '--'} người</p>
                              </div>
                              <div>
                                <p class="text-[9px] uppercase font-black text-slate-400 tracking-tight">Diện tích</p>
                                <p class="text-[11px] text-emerald-700 font-black">${details?.area || '--'} km²</p>
                              </div>
                            </div>
                          `;
                          const btn = document.createElement('button');
                          btn.className = 'w-full bg-[#003366] hover:bg-blue-800 text-white py-3 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 uppercase tracking-widest';
                          btn.innerHTML = 'XEM CHI TIẾT <span class="ml-1">→</span>';
                          btn.onclick = () => (window as any).openDetailView(name);
                          popupContent.appendChild(btn);

                          L.popup({ className: 'custom-popup' })
                            .setLatLng(e.latlng)
                            .setContent(popupContent)
                            .openOn(l._map);
                        }
                      });
                    }}
                  />
                )}
              </MapContainer>

              {/* Floating Legend removed */}
            </motion.div>
          ) : (
            <motion.div 
              key="detail-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="absolute inset-0 z-[2000] bg-white overflow-hidden"
            >
              <DetailView feature={selectedWard} onClose={() => setView('map')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Status Rail */}
      <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[9px] font-bold font-mono text-slate-400 shrink-0 z-[2000]">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-1.5 uppercase font-black">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            System Active
          </div>
          <span className="hidden sm:inline">COORDS: 10.7769° N, 106.7009° E</span>
          <span className="hidden md:inline">DATUM: WGS84</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden sm:inline text-blue-600 uppercase font-black tracking-widest italic">GIS Pipeline Ready</span>
          <span className="opacity-50">PROJECTION: EPSG:4326</span>
        </div>
      </footer>
    </div>
  );
}
