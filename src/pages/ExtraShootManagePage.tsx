/**
 * 보조출연자 촬영관리 화면
 * @returns
 *
 * 수정사항
 * 1. 로그인 api 연결은 추후 삭제 예정
 * 2. 삭제하기 api 아직 연결 안함
 */

import StatusRecruitBox from "@components/StatusRecruitBox";
import styled from "styled-components";
import { useEffect, useState } from "react";
import DropDownSelector from "@components/DropDownSelector";
import CancelCheckModal from "@components/Modal/CancelCheckModal";
import CompleteModal from "@components/Modal/CompleteModal";
import {
  ShootManageList,
  ShootManageSelectStatus,
  ShootManage,
} from "@api/interface";

export default function ExtraShootManagePage() {
  const [applyStatusIdx, setApplyStatusIdx] = useState(0);
  const [recruitBoxes, setRecruitBoxes] = useState<ShootManageList>([]);
  const [modalData, setModalData] = useState<ShootManage | null>(null);
  const [isCancelCheckModalOpen, setIsCancelCheckModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // 페이지 마운트 시 토큰을 받아오는 함수 실행
  useEffect(() => {
    fetch(`${import.meta.env.VITE_SERVER_URL}api/v1/members/login`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email0",
        password: "string",
      }),
    }).then((res) => {
      if (res.status === 200) {
        const token = res.headers.get("authorization");
        if (token && token.startsWith("Bearer ")) {
          const accesToken = token.slice(7);

          localStorage.setItem("accessToken", accesToken);
          console.log(accesToken);
        }
      }
    });
  }, []);

  // applyStatusIdx가 변경될 때마다 API 호출
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No access token found");
      return;
    }

    const status = ShootManageSelectStatus[applyStatusIdx];
    const statusUrl =
      applyStatusIdx === 0
        ? "" // 전체 목록은 /roles만 호출
        : `/${status.toLowerCase()}`;

    fetch(
      `${import.meta.env.VITE_SERVER_URL}api/v1/application-request/member/roles${statusUrl}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: ShootManage[]) => {
        const mappedData = data.map((item) => ({
          ...item,
          applyStatus:
            ShootManageSelectStatus[
              item.applyStatus as unknown as keyof typeof ShootManageSelectStatus
            ],
        }));

        setRecruitBoxes(mappedData);
        const status =
          ShootManageSelectStatus[applyStatusIdx] || "Unknown status";
        console.log(`Data fetched successfully for ${status}:`, data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [applyStatusIdx]);

  // 1~3까지의 배열
  const selcetorList = Array.from({ length: 4 }, (_, i) => i);
  const handler = (selectedIdx: number) => {
    setApplyStatusIdx(selectedIdx);
  };

  const handleDelete = (id: number) => {
    setRecruitBoxes(recruitBoxes.filter((box) => box.id !== id));
  };

  const openCancelModal = (item: ShootManage) => {
    setModalData(item);
    setIsCancelCheckModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelCheckModalOpen(false);
    setModalData(null);
  };

  const openCompleteModal = () => {
    setIsCompleteModalOpen(true);
  };

  const closeCompleteModal = () => {
    setIsCompleteModalOpen(false);
  };

  const handleCancelApplication = (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No access token found");
      return;
    }

    fetch(
      `${import.meta.env.VITE_SERVER_URL}api/v1/application-request/member/application-requests/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}`);
        }
        setRecruitBoxes(recruitBoxes.filter((box) => box.id !== id));
        closeCancelModal(); // Close the CancelCheckModal
        openCompleteModal(); // Open the CompleteModal
      })
      .catch((error) => {
        console.error("Error deleting application:", error);
      });
  };

  const handleCancel = () => {
    if (modalData) {
      handleCancelApplication(modalData.id);
    }
  };

  return (
    <div>
      <Top>
        <DropDownSelector
          currentIdx={applyStatusIdx}
          modalIdxList={selcetorList}
          handler={handler}
        />
      </Top>
      <ListContainer>
        {recruitBoxes.map((box) => (
          <Wrapper key={box.id}>
            <StatusRecruitBox
              shootManageInfo={box}
              onDelete={handleDelete}
              onOpenCancelModal={openCancelModal}
            />
          </Wrapper>
        ))}
      </ListContainer>
      {isCancelCheckModalOpen && modalData && (
        <CancelCheckModal
          title={modalData.title}
          date={modalData.gatheringTime}
          onConfirm={handleCancel}
          onCancel={closeCancelModal}
        />
      )}
      {isCompleteModalOpen && (
        <CompleteModal type="supportCancel" closeModal={closeCompleteModal} />
      )}
    </div>
  );
}

const Wrapper = styled.div`
  width: 365px;
  height: 145px;
`;

const Top = styled.div`
  width: 100%;
  height: fit-content;
  display: flex;
  justify-content: end;
  position: sticky;
  top: 0;
  left: 0;
  background-color: black;
  z-index: 9;
`;

const ListContainer = styled.div`
  /* width: 100%; */
  /* height: 100vh; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  > * {
    margin-bottom: 10px;
  }
`;
